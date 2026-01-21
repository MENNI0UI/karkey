/**
 * Cache utilities for server actions
 * Replaced filesystem cache with In-Memory Cache for scalability.
 * 
 * NOTE: This file does NOT use "use server" because it exports constants.
 * These are utilities meant to be called FROM server actions.
 */

// Global in-memory cache store
// Key -> { data: any, timestamp: number }
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const MEMORY_CACHE = new Map<string, CacheEntry<any>>();

export const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Cache keys (previously file paths, now simple keys)
export const CACHE_FILES = {
  approvedVehicles: "approvedVehicles",
  filterOptions: "filterOptions",
  directSalesFilterOptions: "directSalesFilterOptions",
} as const;

/**
 * Read cache (no TTL check)
 * @param key - Cache key. Defaults to approvedVehicles
 */
export async function readCache<T = unknown[]>(key?: string): Promise<T | null> {
  const cacheKey = key ?? CACHE_FILES.approvedVehicles;
  const entry = MEMORY_CACHE.get(cacheKey);

  if (!entry) return null;
  // clone to avoid mutation side-effects interactions between callers
  try {
    return JSON.parse(JSON.stringify(entry.data)) as T;
  } catch {
    return entry.data as T;
  }
}

/**
 * Read cache with TTL check
 */
export async function readCacheWithTTL<T>(
  key: string,
  ttlMs: number = CACHE_TTL_MS
): Promise<T | null> {
  const entry = MEMORY_CACHE.get(key);
  if (!entry) return null;

  const age = Date.now() - entry.timestamp;
  if (age > ttlMs) {
    MEMORY_CACHE.delete(key);
    return null; // expired
  }

  try {
    return JSON.parse(JSON.stringify(entry.data)) as T;
  } catch {
    return entry.data as T;
  }
}

/**
 * Write data to cache
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

  MEMORY_CACHE.set(cacheKey, {
    data: content,
    timestamp: Date.now()
  });
}

/**
 * Invalidate (delete) a cache entry
 */
export async function invalidateCache(key: string): Promise<void> {
  MEMORY_CACHE.delete(key);
}

/**
 * Invalidate all cache entries
 */
export async function invalidateAllCaches(): Promise<void> {
  MEMORY_CACHE.clear();
}
