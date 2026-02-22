type RateLimitOptions = {
  key: string
  limit: number
  windowMs: number
}

type RateLimitEntry = {
  count: number
  resetAt: number
}

declare global {
  // eslint-disable-next-line no-var
  var __movieMoodRateLimitStore: Map<string, RateLimitEntry> | undefined
}

const store = globalThis.__movieMoodRateLimitStore ?? new Map<string, RateLimitEntry>()

if (!globalThis.__movieMoodRateLimitStore) {
  globalThis.__movieMoodRateLimitStore = store
}

export function getRequestIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown"
  }

  return request.headers.get("x-real-ip") || "unknown"
}

export function checkRateLimit({ key, limit, windowMs }: RateLimitOptions) {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.resetAt <= now) {
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return {
      allowed: true,
      remaining: Math.max(limit - 1, 0),
      resetAt,
      retryAfterSeconds: Math.ceil(windowMs / 1000),
    }
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
      retryAfterSeconds: Math.max(Math.ceil((entry.resetAt - now) / 1000), 1),
    }
  }

  entry.count += 1
  store.set(key, entry)

  return {
    allowed: true,
    remaining: Math.max(limit - entry.count, 0),
    resetAt: entry.resetAt,
    retryAfterSeconds: Math.max(Math.ceil((entry.resetAt - now) / 1000), 1),
  }
}
