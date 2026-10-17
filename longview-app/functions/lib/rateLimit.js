/**
 * Tiny Firestore-backed rate limiter (per user, per action).
 * Callable functions are reachable by any signed-in user, so anything that
 * sends email or checks a secret needs a ceiling.
 */
export async function takeToken(db, key, { max, windowMs }) {
  const ref = db.collection('rateLimits').doc(key)
  const now = Date.now()

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref)
    const recent = (snap.exists ? snap.data().hits : []).filter((t) => now - t < windowMs)

    if (recent.length >= max) return false
    tx.set(ref, { hits: [...recent, now] })
    return true
  })
}
