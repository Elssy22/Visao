import { Redis } from '@upstash/redis'

const redisUrl = process.env.UPSTASH_REDIS_REST_URL
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

// Redis est optionnel en développement
let redis: Redis | null = null

if (redisUrl && redisToken) {
  redis = new Redis({
    url: redisUrl,
    token: redisToken,
  })
  console.log('✅ Redis connected')
} else {
  console.log('⚠️ Redis not configured - using in-memory fallbacks')
}

export { redis }

// Cache en mémoire pour le dev (quand Redis n'est pas disponible)
const memoryCache = new Map<string, { value: unknown; expiry: number }>()
const rateLimitCache = new Map<string, { count: number; expiry: number }>()

// Helper pour le rate limiting
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const now = Date.now()
  const resetAt = (Math.floor(now / (windowSeconds * 1000)) + 1) * windowSeconds * 1000

  if (redis) {
    const windowKey = `rate:${key}:${Math.floor(now / (windowSeconds * 1000))}`
    const count = await redis.incr(windowKey)

    if (count === 1) {
      await redis.expire(windowKey, windowSeconds)
    }

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      resetAt,
    }
  }

  // Fallback en mémoire
  const windowKey = `rate:${key}:${Math.floor(now / (windowSeconds * 1000))}`
  const cached = rateLimitCache.get(windowKey)

  if (!cached || cached.expiry < now) {
    rateLimitCache.set(windowKey, { count: 1, expiry: resetAt })
    return { allowed: true, remaining: limit - 1, resetAt }
  }

  cached.count++
  return {
    allowed: cached.count <= limit,
    remaining: Math.max(0, limit - cached.count),
    resetAt,
  }
}

// Helper pour le cache
export async function getOrSet<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const now = Date.now()

  if (redis) {
    const cached = await redis.get<T>(key)
    if (cached !== null) {
      return cached
    }

    const value = await fetcher()
    await redis.setex(key, ttlSeconds, value)
    return value
  }

  // Fallback en mémoire
  const cached = memoryCache.get(key)
  if (cached && cached.expiry > now) {
    return cached.value as T
  }

  const value = await fetcher()
  memoryCache.set(key, { value, expiry: now + ttlSeconds * 1000 })
  return value
}
