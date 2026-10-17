const RESEND_URL = 'https://api.resend.com/emails'

/** An email-provider failure. `status` is the HTTP status (0 = network/timeout)*/
export class MailError extends Error {
  constructor(message, { status = 0, retryable = false } = {}) {
    super(message)
    this.name = 'MailError'
    this.status = status
    this.retryable = retryable
  }
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Send one email. Attachments are { filename, content: Buffer, contentType }.
 *
 * Transient failures (network, 429, 5xx) are retried with a short back-off.
 * That is only safe because every call carries an Idempotency-Key: if the
 * first attempt actually went through, Resend ignores the repeat instead of
 * sending a duplicate. Client errors (400/401/403/422) are never retried.
 */
export async function sendEmail(
  { apiKey, from, to, subject, text, html, attachments = [], idempotencyKey },
  { fetchImpl = fetch, url = RESEND_URL, retries = 2, backoffMs = 400, timeoutMs = 10_000 } = {},
) {
  if (!apiKey) throw new MailError('No email API key configured.')

  const body = JSON.stringify({
    from,
    to: [to],
    subject,
    text,
    html,
    attachments: attachments.map((a) => ({
      filename: a.filename,
      content: Buffer.from(a.content).toString('base64'),
      content_type: a.contentType,
    })),
  })

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }
  if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey

  let lastError
  for (let attempt = 0; attempt <= retries; attempt++) {
    if (attempt > 0) await wait(backoffMs * attempt)

    try {
      const response = await fetchImpl(url, {
        method: 'POST',
        headers,
        body,
        signal: AbortSignal.timeout(timeoutMs),
      })

      if (response.ok) {
        const data = await response.json()
        return { id: data.id }
      }

      // Resend explains the problem in the body; keep it for the server logs only.
      const detail = await response.json().catch(() => ({}))
      const retryable = response.status === 429 || response.status >= 500
      lastError = new MailError(detail.message || `Email provider returned ${response.status}.`, {
        status: response.status,
        retryable,
      })
      if (!retryable) throw lastError
    } catch (err) {
      if (err instanceof MailError && !err.retryable) throw err
      lastError =
        err instanceof MailError
          ? err
          : new MailError(`Email request failed: ${err.message}`, { retryable: true })
    }
  }
  throw lastError
}

/** Escape text before it goes into an HTML email body */
export function escapeHtml(text) {
  return String(text).replace(
    /[&<>"']/g,
    (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch],
  )
}
