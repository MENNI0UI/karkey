/**
 * Cache utilities for server actions
 * Uses Tiered Caching: Redis (L2) -> Memory (L1) -> DB
 * 
 * NOTE: This file does NOT use "use server" because it exports constants.
 * These are utilities meant to be called FROM server actions.
 */

import { LRUCache } from 'lru-cache';
import Redis from 'ioredis';

// LRU Cache configuration (L1)
const MAX_CACHE_ENTRIES = 500; // Maximum number of entries
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes default TTL

// Redis Configuration (L2)
const REDIS_URL = process.env.REDIS_URL;
let redisClient: Redis | null = null;

if (REDIS_URL) {
  try {
    redisClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 1, // Don't block too long on fail
      connectTimeout: 2000,
      retryStrategy: (times: number) => Math.min(times * 50, 2000)
    });
    redisClient.on('error', (err: Error) => {
      console.warn('[Redis] Connection error, falling back to memory:', err.message);
    });
  } catch (e) {
    console.warn('[Redis] Failed to initialize:', e);
  }
}

// LRU Cache instance - replaces unbounded Map
const MEMORY_CACHE = new LRUCache<string, any>({
  max: MAX_CACHE_ENTRIES,
  ttl: DEFAULT_TTL_MS,
  allowStale: false, // Don't return stale entries
  updateAgeOnGet: true, // Reset TTL on access
});

export const CACHE_TTL_MS = DEFAULT_TTL_MS;

// Cache keys (previously file paths, now simple keys)
export const CACHE_FILES = {
  approvedVehicles: "approvedVehicles",
  filterOptions: "filterOptions",
  directSalesFilterOptions: "directSalesFilterOptions",
} as const;

/**
 * Read cache (L1 Memory -> L2 Redis)
 * @param key - Cache key. Defaults to approvedVehicles
 */
export async function readCache<T = unknown[]>(key?: string): Promise<T | null> {
  const cacheKey = key ?? CACHE_FILES.approvedVehicles;

  // 1. Check Memory (Far core / Instance local)
  const memoryEntry = MEMORY_CACHE.get(cacheKey);
  if (memoryEntry !== undefined) {
    try {
      return JSON.parse(JSON.stringify(memoryEntry)) as T;
    } catch {
      return memoryEntry as T;
    }
  }

  // 2. Check Redis (Shared L2)
  if (redisClient) {
    try {
      const raw = await redisClient.get(cacheKey);
      if (raw) {
        const data = JSON.parse(raw);
        // Populate L1 for next time
        MEMORY_CACHE.set(cacheKey, data);
        return data as T;
      }
    } catch (err) {
      // Redis failed, just return null (miss)
    }
  }

  return null;
}

/**
 * Read cache with TTL check (LRU handles TTL, but we support custom TTL)
 */
export async function readCacheWithTTL<T>(
  key: string,
  _ttlMs: number = CACHE_TTL_MS
): Promise<T | null> {
  // LRU cache handles TTL automatically, so this is just a read
  return readCache<T>(key);
}

/**
 * Write data to cache (L1 + L2)
 * @param keyOrData - Either the data to write (uses default key) or cache key
 * @param data - The data to write (when first arg is key)
 */
export async function writeCache(keyOrData: unknown, data?: unknown): Promise<void> {
  let cacheKey: string;
  let content: unknown;

  // Support both patterns:
  // writeCache(data) - writes to default key
  // writeCache(key, data) - writes to specific key
  if (data === undefined) {
    cacheKey = CACHE_FILES.approvedVehicles;
    content = keyOrData;
  } else {
    cacheKey = keyOrData as string;
    content = data;
  }

  // 1. Write Memory
  MEMORY_CACHE.set(cacheKey, content);

  // 2. Write Redis (Async, don't block return)
  if (redisClient) {
    // Use default TTL for Redis keys to prevent stale data sticking forever
    const ttlSeconds = Math.ceil(DEFAULT_TTL_MS / 1000);
    redisClient.set(cacheKey, JSON.stringify(content), 'EX', ttlSeconds).catch((err: Error) => {
      console.warn('[Redis] Write failed:', err.message);
    });
  }
}

/**
 * Invalidate (delete) a cache entry
 */
export async function invalidateCache(key: string): Promise<void> {
  MEMORY_CACHE.delete(key);
  if (redisClient) {
    await redisClient.del(key);
  }
}

/**
 * Invalidate all cache entries
 */
export async function invalidateAllCaches(): Promise<void> {
  MEMORY_CACHE.clear();
  if (redisClient) {
    try {
      const keys = await redisClient.keys('*');
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } catch { }
  }
}

/**
 * Get cache statistics (useful for monitoring)
 */
export function getCacheStats() {
  return {
    size: MEMORY_CACHE.size,
    maxSize: MAX_CACHE_ENTRIES,
    redisConnected: redisClient?.status === 'ready'
  };
}


