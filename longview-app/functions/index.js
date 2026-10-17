import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https'
import { onDocumentCreated } from 'firebase-functions/v2/firestore'
import { defineSecret, defineString } from 'firebase-functions/params'
import { setGlobalOptions } from 'firebase-functions/v2'
import { logger } from 'firebase-functions'
import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { timingSafeEqual, createHash, randomUUID } from 'node:crypto'
import { sanitiseSummaryRequest, buildSummaryPdf, cleanText } from './lib/summary.js'
import { sendEmail, escapeHtml } from './lib/mailer.js'
import { takeToken } from './lib/rateLimit.js'

/**
 * Longview Cloud Functions (BR E.1 Cloud Functions, BR D.2 Email)
 *
 * One of each trigger style, because each fits a different job:
 *   - assignRole            callable          server-side admin invite check
 *   - sendLearningSummary   callable          builds a PDF and emails it (Resend)
 *   - adminSummary          callable          admin-only aggregate stats
 *   - sendWelcomeEmail      Firestore trigger runs when a profile is created
 *   - stats                 HTTPS (REST)      public, read-only JSON endpoint
 *
 * Callables receive the caller's verified identity in request.auth, so there
 * is no hand-rolled token parsing. Secrets (RESEND_API_KEY, ADMIN_INVITE_CODE)
 * live in Secret Manager and are only readable inside these functions - they
 * never reach the browser.
 */

setGlobalOptions({ region: 'australia-southeast1', maxInstances: 5 })
initializeApp()
const db = getFirestore()

const RESEND_API_KEY = defineSecret('RESEND_API_KEY')
const ADMIN_INVITE_CODE = defineSecret('ADMIN_INVITE_CODE')
// onboarding@resend.dev works with no domain set-up, but Resend only delivers
// from it to the account owner's own address. Set FROM_EMAIL in functions/.env
// once a domain is verified.
const DEFAULT_FROM = 'Longview <onboarding@resend.dev>'
const DEFAULT_PUBLIC_URL = 'https://longview-fit5032.web.app'
const FROM_EMAIL = defineString('FROM_EMAIL', { default: DEFAULT_FROM })
const PUBLIC_URL = defineString('PUBLIC_URL', { default: DEFAULT_PUBLIC_URL })

// The `|| default` keeps these working in contexts where params aren't resolved.
const fromAddress = () => FROM_EMAIL.value() || DEFAULT_FROM
const publicUrl = () => PUBLIC_URL.value() || DEFAULT_PUBLIC_URL

/** Callable functions expose request.auth when the caller is signed in. */
function requireSignedIn(request) {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Please log in first.')
  }
  return request.auth.uid
}

async function getProfile(uid) {
  const snap = await db.collection('users').doc(uid).get()
  if (!snap.exists) throw new HttpsError('failed-precondition', 'Profile not found.')
  return snap.data()
}

/** Hash both sides first so timingSafeEqual always gets equal-length buffers. */
function codesMatch(supplied, expected) {
  const a = createHash('sha256').update(String(supplied)).digest()
  const b = createHash('sha256').update(String(expected)).digest()

  return timingSafeEqual(a, b)
}

// ---------------------------------------------------------------------------
// assignRole - the only path to the admin role
// ---------------------------------------------------------------------------
export const assignRole = onCall({ secrets: [ADMIN_INVITE_CODE] }, async (request) => {
  const uid = requireSignedIn(request)

  // 5 guesses an hour per account stops brute-forcing the invite code.
  const allowed = await takeToken(db, `assignRole_${uid}`, { max: 5, windowMs: 60 * 60 * 1000 })
  if (!allowed) {
    throw new HttpsError('resource-exhausted', 'Too many attempts. Try again later.')
  }

  const supplied = request.data?.inviteCode
  if (typeof supplied !== 'string' || !codesMatch(supplied, ADMIN_INVITE_CODE.value())) {
    logger.warn('Rejected admin invite code', { uid })
    throw new HttpsError('permission-denied', 'That invite code was not accepted.')
  }

  await db.collection('users').doc(uid).update({ role: 'admin' })
  logger.info('Granted admin role', { uid })
  return { role: 'admin' }
})

// ---------------------------------------------------------------------------
// sendLearningSummary - BR D.2: email with a generated PDF attachment
// ---------------------------------------------------------------------------
export const sendLearningSummary = onCall({ secrets: [RESEND_API_KEY] }, async (request) => {
  const uid = requireSignedIn(request)

  // Validate before spending a rate-limit token on a request that can't succeed.
  let summary
  try {
    summary = sanitiseSummaryRequest(request.data)
  } catch (err) {
    throw new HttpsError('invalid-argument', err.message)
  }

  const allowed = await takeToken(db, `summary_${uid}`, { max: 3, windowMs: 60 * 60 * 1000 })
  if (!allowed) {
    throw new HttpsError(
      'resource-exhausted',
      'You can request 3 summaries per hour. Please try again later.',
    )
  }

  const profile = await getProfile(uid)
  // The recipient comes from the verified login token, NOT from the request,
  // so this endpoint can't be used to send mail to arbitrary addresses.
  const to = request.auth.token.email
  if (!to) throw new HttpsError('failed-precondition', 'Your account has no email address.')

  const name = cleanText(profile.name, 60)
  const pdf = await buildSummaryPdf({ name, ...summary })

  try {
    await sendEmail({
      apiKey: RESEND_API_KEY.value(),
      from: fromAddress(),
      to,
      subject: summary.subject,
      text: `Hi ${name},\n\n${summary.note ? `${summary.note}\n\n` : ''}Your learning summary is attached as a PDF.\n\n- The Longview team`,
      html:
        `<p>Hi ${escapeHtml(name)},</p>` +
        (summary.note ? `<blockquote>${escapeHtml(summary.note)}</blockquote>` : '') +
        `<p>Your learning summary is attached as a PDF.</p><p>- The Longview team</p>`,
      attachments: [
        { filename: 'longview-learning-summary.pdf', content: pdf, contentType: 'application/pdf' },
      ],
      // One key per request: if sendEmail retries after a timeout, Resend
      // drops the repeat instead of delivering a second copy.
      idempotencyKey: `summary-${uid}-${randomUUID()}`,
    })
  } catch (err) {
    // The provider's message can name the account or address, so it stays in the logs.
    logger.error('Email provider rejected the summary', {
      uid,
      status: err.status,
      detail: err.message,
    })
    throw new HttpsError(
      'unavailable',
      'We could not send the email right now. Please try again later.',
    )
  }

  await db.collection('mailLog').add({ uid, kind: 'summary', at: FieldValue.serverTimestamp() })
  return { sent: true, to }
})

// adminSummary - server-verified admin check + aggregate query
export const adminSummary = onCall(async (request) => {
  const uid = requireSignedIn(request)

  // Role is read from Firestore on the server
  const profile = await getProfile(uid)
  if (profile.role !== 'admin') {
    logger.warn('Non-admin called adminSummary', { uid })
    throw new HttpsError('permission-denied', 'Admins only.')
  }

  const users = db.collection('users')
  const [total, admins, summaries] = await Promise.all([
    users.count().get(),
    users.where('role', '==', 'admin').count().get(),
    db.collection('mailLog').where('kind', '==', 'summary').count().get(),
  ])

  return {
    totalAccounts: total.data().count,
    admins: admins.data().count,
    members: total.data().count - admins.data().count,
    summariesSent: summaries.data().count,
  }
})

// sendWelcomeEmail - event-driven: fires when users/{uid} is first written
export const sendWelcomeEmail = onDocumentCreated(
  { document: 'users/{uid}', secrets: [RESEND_API_KEY] },
  async (event) => {
    const profile = event.data?.data()
    if (!profile?.email) return

    const name = cleanText(profile.name, 60)
    try {
      await sendEmail({
        apiKey: RESEND_API_KEY.value(),
        from: fromAddress(),
        to: profile.email,
        subject: 'Welcome to Longview',
        text: `Hi ${name},\n\nThanks for joining Longview. Browse the course catalogue and find a group near you.\n\n- The Longview team`,
        html: `<p>Hi ${escapeHtml(name)},</p><p>Thanks for joining Longview. Browse the course catalogue and find a group near you.</p><p>- The Longview team</p>`,
        // Event triggers are delivered at least once, so a retry must not email twice.
        idempotencyKey: `welcome-${event.params.uid}`,
      })
    } catch (err) {
      // A failed welcome email must never break sign-up, so log and move on.
      logger.error('Welcome email failed', {
        uid: event.params.uid,
        status: err.status,
        detail: err.message,
      })
    }
  },
)

// stats - a small public REST endpoint (plain HTTPS function)
//
// Callables suit our own app (they bring the logged-in user with them). A plain
// HTTPS function suits public, cacheable data that anything can fetch. Reached
// through Hosting at GET /api/stats (see firebase.json), so the browser sees one
// origin and the CDN can cache it.

export const stats = onRequest(
  {
    cors: [
      'https://longview-fit5032.web.app',
      'https://longview-fit5032.firebaseapp.com',
      'http://localhost:5173',
    ],
    invoker: 'public',
  },
  async (req, res) => {
    if (req.method !== 'GET') {
      res.set('Allow', 'GET')
      res.status(405).json({ code: 'method-not-allowed', message: 'Use GET.', status: 405 })
      return
    }

    try {
      const [accounts, summaries] = await Promise.all([
        db.collection('users').count().get(),
        db.collection('mailLog').where('kind', '==', 'summary').count().get(),
      ])
      // Aggregates only - no names, emails or ids leave the server here.
      res.set('Cache-Control', 'public, max-age=60, s-maxage=300')
      res.status(200).json({
        kind: 'longview#stats',
        self: `${publicUrl()}/api/stats`,
        accounts: accounts.data().count,

        summariesSent: summaries.data().count,
        generatedAt: new Date().toISOString(),
      })
    } catch (err) {
      logger.error('stats failed', { detail: err.message })
      res
        .status(500)
        .json({ code: 'internal-error', message: 'Could not load statistics.', status: 500 })
    }
  },
)
