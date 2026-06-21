/**
 * Minimal in-memory sliding-window rate limiter for API routes.
 *
 * Per-instance only (resets on deploy/restart, not shared across serverless
 * instances) — intended as an abuse brake for AI/TTS proxy routes, not as
 * billing-grade quota enforcement.
 */

type Bucket = { timestamps: number[] }

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 10_000

export type RateLimitResult = { ok: boolean; retryAfterSeconds: number }

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now()
  let bucket = buckets.get(key)
  if (!bucket) {
    if (buckets.size >= MAX_BUCKETS) buckets.clear()
    bucket = { timestamps: [] }
    buckets.set(key, bucket)
  }

  bucket.timestamps = bucket.timestamps.filter(t => now - t < windowMs)
  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0]
    return { ok: false, retryAfterSeconds: Math.ceil((oldest + windowMs - now) / 1000) }
  }

  bucket.timestamps.push(now)
  return { ok: true, retryAfterSeconds: 0 }
}
