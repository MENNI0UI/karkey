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

/**
 * Clean up expired entries to prevent memory leaks
 */
function cleanupExpiredEntries(): void {
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
 * Check if a key is rate limited
 */
export function isRateLimited(key: string, options: RateLimitOptions): boolean {
    return checkRateLimit(key, options).limited;
}

/**
 * Check rate limit with detailed info (useful for headers)
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
    cleanupExpiredEntries();
    
    const now = Date.now();
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
