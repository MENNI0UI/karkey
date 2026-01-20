import fs from "fs"
import path from "path"
import os from "os"

/**
 * Cache utilities for server actions
 * Provides file-based caching with TTL support
 * 
 * NOTE: This file does NOT use "use server" because it exports constants.
 * These are utilities meant to be called FROM server actions, not exposed as server actions themselves.
 */

export const CACHE_DIR = path.join(os.tmpdir(), "karkey-cache")
export const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

// Cache file paths
export const CACHE_FILES = {
  approvedVehicles: path.join(CACHE_DIR, "approvedVehicles.json"),
  filterOptions: path.join(CACHE_DIR, "filterOptions.json"),
  directSalesFilterOptions: path.join(CACHE_DIR, "directSalesFilterOptions.json"),
} as const

/**
 * Read cache file (no TTL check)
 * @param cacheFile - Optional path to cache file. Defaults to approvedVehicles.json
 */
export async function readCache<T = unknown[]>(cacheFile?: string): Promise<T | null> {
  const filePath = cacheFile ?? CACHE_FILES.approvedVehicles
  try {
    const raw = await fs.promises.readFile(filePath, "utf8")
    if (!raw || !raw.trim()) return null
    const parsed = JSON.parse(raw)
    return parsed as T
  } catch {
    return null
  }
}

/**
 * Read cache file with TTL check
 */
export async function readCacheWithTTL<T>(
  cacheFile: string, 
  ttlMs: number = CACHE_TTL_MS
): Promise<T | null> {
  try {
    const stat = await fs.promises.stat(cacheFile)
    const age = Date.now() - stat.mtimeMs
    if (age > ttlMs) return null // expired

    const raw = await fs.promises.readFile(cacheFile, "utf8")
    if (!raw || !raw.trim()) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/**
 * Write data to cache file
 * @param dataOrFile - Either the data to write (uses default file) or file path
 * @param data - The data to write (when first arg is file path)
 */
export async function writeCache(dataOrFile: unknown, data?: unknown): Promise<void> {
  let filePath: string
  let content: unknown
  
  // Support both patterns:
  // writeCache(data) - writes to default file
  // writeCache(cacheFile, data) - writes to specific file
  if (data === undefined) {
    filePath = CACHE_FILES.approvedVehicles
    content = dataOrFile
  } else {
    filePath = dataOrFile as string
    content = data
  }
  
  try {
    await fs.promises.mkdir(CACHE_DIR, { recursive: true })
    await fs.promises.writeFile(filePath, JSON.stringify(content), "utf8")
  } catch {
    // best-effort only - don't throw
  }
}

/**
 * Invalidate (delete) a cache file
 */
export async function invalidateCache(cacheFile: string): Promise<void> {
  try {
    await fs.promises.unlink(cacheFile)
  } catch {
    // ignore if file doesn't exist
  }
}

/**
 * Invalidate all cache files
 */
export async function invalidateAllCaches(): Promise<void> {
  await Promise.allSettled(
    Object.values(CACHE_FILES).map(file => invalidateCache(file))
  )
}
