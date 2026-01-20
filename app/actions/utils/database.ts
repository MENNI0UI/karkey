import { db } from "@/lib/database"
import type { QueryParams } from "@/lib/database"

/**
 * Database query utilities for server actions
 * Provides timeout-wrapped queries and common patterns
 * 
 * NOTE: This file does NOT use "use server" because it exports constants.
 * These are utilities meant to be called FROM server actions, not exposed as server actions themselves.
 */

// Default timeout for database queries (5 seconds)
export const DEFAULT_DB_TIMEOUT_MS = 5000

/**
 * Execute a database query with timeout protection
 * Prevents hanging queries from blocking server actions
 * 
 * Overloaded to support both:
 * - dbQueryWithTimeout(promiseFn, timeout) - Function that returns a promise
 * - dbQueryWithTimeout(promise, timeout) - Direct promise (legacy pattern)
 */
export async function dbQueryWithTimeout<T>(
  queryOrFn: Promise<T> | (() => Promise<T>),
  timeoutMs: number = DEFAULT_DB_TIMEOUT_MS
): Promise<T> {
  // Support both patterns: direct promise or function returning promise
  const queryPromise = typeof queryOrFn === 'function' ? queryOrFn() : queryOrFn
  
  let timer: NodeJS.Timeout
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Query timed out after ${timeoutMs}ms`)), timeoutMs)
  })
  
  return Promise.race([
    queryPromise.finally(() => clearTimeout(timer!)),
    timeoutPromise
  ])
}

/**
 * Execute a raw SQL query with timeout
 */
export async function queryWithTimeout<T>(
  sql: string,
  params: QueryParams = [],
  timeoutMs: number = DEFAULT_DB_TIMEOUT_MS
): Promise<T[]> {
  return dbQueryWithTimeout(
    async () => {
      const result = await db.query(sql, params)
      return result as T[]
    },
    timeoutMs
  )
}

/**
 * Execute a count query and return the number
 */
export async function countQuery(
  sql: string,
  params: QueryParams = []
): Promise<number> {
  const result = await db.query(sql, params) as Array<{ count: number }>
  return result[0]?.count ?? 0
}
