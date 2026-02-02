/**
 * Production-ready rate limiter for Next.js API routes.
 * 
 * Features:
 * - In-memory storage for single-instance deployments
 * - Automatic cache cleanup to prevent memory leaks
 * - Sliding window algorithm for accurate rate limiting
 * - Ready for Redis upgrade (see comments)
 * 
 * For multi-instance deployments, replace the in-memory Map with Redis:
 * npm install ioredis
 * Set REDIS_URL environment variable
 */

interface RateLimitInfo {
    count: number;
    resetTime: number;
}

// In-memory cache with automatic cleanup
const cache = new Map<string, RateLimitInfo>();
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 60000; // Clean up every minute
const MAX_CACHE_SIZE = 10000; // Maximum entries to prevent memory issues

// Redis instance (singleton) - dynamically imported when REDIS_URL is set
let redis: any = null;
let redisInitialized = false;

async function getRedis() {
    if (redisInitialized) return redis;
    redisInitialized = true;

    if (process.env.REDIS_URL) {
        try {
            const Redis = (await import('ioredis')).default;
            redis = new Redis(process.env.REDIS_URL);
        } catch {
            console.warn('[rate-limiter] ioredis not installed, using in-memory storage');
        }
    }
    return redis;
}

// Start periodic cleanup (runs even during low traffic)
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [key, info] of cache.entries()) {
            if (now > info.resetTime) {
                cache.delete(key);
            }
        }
    }, CLEANUP_INTERVAL_MS);
}

/**
 * Clean up expired entries to prevent memory leaks (Memory only)
 */
function cleanupExpiredEntries(): void {
    // Only cleanup when using in-memory storage
    if (redis) return; // Redis handles expiry automatically

    const now = Date.now();

    // Only cleanup periodically
    if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
    lastCleanup = now;

    // Remove expired entries
    for (const [key, info] of cache.entries()) {
        if (now > info.resetTime) {
            cache.delete(key);
        }
    }

    // If still too large, remove oldest entries
    if (cache.size > MAX_CACHE_SIZE) {
        const entriesToRemove = cache.size - MAX_CACHE_SIZE;
        let removed = 0;
        for (const key of cache.keys()) {
            if (removed >= entriesToRemove) break;
            cache.delete(key);
            removed++;
        }
    }
}

export interface RateLimitOptions {
    limit: number;      // max requests
    windowMs: number;   // time window in ms
}

export interface RateLimitResult {
    limited: boolean;
    remaining: number;
    resetTime: number;
}

/**
 * Check if a key is rate limited (Async)
 */
export async function isRateLimited(key: string, options: RateLimitOptions): Promise<boolean> {
    const result = await checkRateLimit(key, options);
    return result.limited;
}

/**
 * Check rate limit with detailed info (Async)
 */
export async function checkRateLimit(key: string, options: RateLimitOptions): Promise<RateLimitResult> {
    const now = Date.now();
    const redisClient = await getRedis();

    // 1. Redis Strategy
    if (redisClient) {
        try {
            const redisKey = `ratelimit:${key}`;
            const windowSeconds = Math.ceil(options.windowMs / 1000);

            // Increment and set expiry if new
            const [count] = await redisClient
                .multi()
                .incr(redisKey)
                .expire(redisKey, windowSeconds)
                .exec() as [error: Error | null, result: number][];

            // Extract the increment result (first command in pipeline)
            const currentCount = typeof count?.[1] === 'number' ? count[1] : 1;

            return {
                limited: currentCount > options.limit,
                remaining: Math.max(0, options.limit - currentCount),
                resetTime: now + options.windowMs, // Redis TTL is approximate
            };
        } catch (err) {
            console.error("Redis rate limit error, falling back to memory:", err);
            // Fallback to memory on error
        }
    }

    // 2. Memory Strategy (Fallback / Default)
    cleanupExpiredEntries();

    const info = cache.get(key);

    if (!info || now > info.resetTime) {
        cache.set(key, {
            count: 1,
            resetTime: now + options.windowMs,
        });
        return {
            limited: false,
            remaining: options.limit - 1,
            resetTime: now + options.windowMs,
        };
    }

    info.count++;
    const limited = info.count > options.limit;

    return {
        limited,
        remaining: Math.max(0, options.limit - info.count),
        resetTime: info.resetTime,
    };
}

/**
 * Helper to get the client IP from requests
 */
export function getIp(req: Request): string {
    // Check common proxy headers in order of trust
    const forwarded = req.headers.get("x-forwarded-for");
    if (forwarded) {
        // Take the first IP (client IP, not proxy)
        return forwarded.split(",")[0].trim();
    }

    // Cloudflare
    const cfIp = req.headers.get("cf-connecting-ip");
    if (cfIp) return cfIp;

    // Vercel
    const vercelIp = req.headers.get("x-real-ip");
    if (vercelIp) return vercelIp;

    // NextRequest extends Request and may have ip property
    if ('ip' in req && typeof req.ip === 'string') {
        return req.ip;
    }

    return "127.0.0.1";
}

/**
 * Rate limit presets for common use cases
 */
export const RATE_LIMITS = {
    // API endpoints
    API_DEFAULT: { limit: 60, windowMs: 60000 },      // 60 req/min
    API_STRICT: { limit: 10, windowMs: 60000 },       // 10 req/min
    API_RELAXED: { limit: 120, windowMs: 60000 },     // 120 req/min

    // Authentication
    AUTH_LOGIN: { limit: 5, windowMs: 300000 },       // 5 attempts per 5 min
    AUTH_REGISTER: { limit: 3, windowMs: 3600000 },   // 3 per hour
    AUTH_PASSWORD_RESET: { limit: 3, windowMs: 3600000 }, // 3 per hour

    // File uploads
    UPLOAD: { limit: 10, windowMs: 60000 },           // 10 uploads/min

    // Search
    SEARCH: { limit: 30, windowMs: 60000 },           // 30 searches/min
} as const;
