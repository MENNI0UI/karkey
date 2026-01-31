// Database Adapter for Frontend
// Now uses Prisma as the primary database client
// mysql2 pool removed and shimmed via Prisma for backward compatibility

import type { User, SafeUser } from "./types"
import prisma from "./prisma"

// Re-export Prisma client for direct usage
export { prisma }

// Helper types from Prisma (🆕 vehicles/auctions/bids removed - using direct_sales)
export type {
  users as UserModel,
  direct_sales as VehicleModel, // Alias for backward compatibility
  direct_sales as AuctionModel, // Alias for backward compatibility  
  notifications as NotificationModel,
} from "@prisma/client"

// Type definitions for database operations
export type QueryParams = (string | number | boolean | null | undefined)[]
export type QueryResult<T = unknown> = [T, undefined]
export type ExecuteResult = [{ affectedRows: number }, undefined]

export interface PoolConnection {
  release: () => void
  query: <T = unknown>(sql: string, params: QueryParams) => Promise<QueryResult<T>>
  execute: (sql: string, params: QueryParams) => Promise<ExecuteResult>
}

export interface DatabasePool {
  query: <T = unknown>(sql: string, params?: QueryParams) => Promise<QueryResult<T>>
  execute: (sql: string, params?: QueryParams) => Promise<ExecuteResult>
  getConnection: () => Promise<PoolConnection>
  end: () => Promise<void>
  on: (event: string, handler: () => void) => void
}

// Mock pool for backward compatibility using Prisma
// This funnels legacy pool calls through Prisma
export const pool: DatabasePool = {
  query: async <T = unknown>(sql: string, params: QueryParams = []): Promise<QueryResult<T>> => {
    try {
      // Prisma $queryRawUnsafe returns the result set directly
      const result = await prisma.$queryRawUnsafe(sql, ...params)
      // Legacy code expects [rows, fields], but Prisma returns just rows (mostly)
      // We simulate [rows, undefined] to keep destructuring working: const [rows] = await pool.query(...)
      return [result as T, undefined]
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[lib/database] ❌ query failed. SQL: ${sql.substring(0, 300)}`, message)
      throw err
    }
  },
  execute: async (sql: string, params: QueryParams = []): Promise<ExecuteResult> => {
    try {
      // executeRawUnsafe returns count of affected rows
      const result = await prisma.$executeRawUnsafe(sql, ...params)
      // Legacy execute returns [ResultSetHeader, undefined]
      return [{ affectedRows: result }, undefined]
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[lib/database] ❌ execute failed. SQL: ${sql.substring(0, 300)}`, message)
      throw err
    }
  },
  getConnection: async (): Promise<PoolConnection> => {
    // Return a dummy connection object that just delegates to the pool shim
    return {
      release: () => { },
      query: async <T = unknown>(sql: string, params: QueryParams) => pool.query<T>(sql, params),
      execute: async (sql: string, params: QueryParams) => pool.execute(sql, params),
    }
  },
  end: async () => {
    // prisma disconnect handled globally/automatically
  },
  on: () => { }, // mock event listener
}

// Pool proxy (redundant now but kept for interface match)
const poolProxy = pool

// Database adapter instance type
interface DatabaseAdapter {
  pool: DatabasePool
  prisma: typeof prisma
  users: unknown
  verifications: unknown
  notifications: unknown
  query: DatabasePool['query']
  execute: DatabasePool['execute']
  getDB: () => DatabasePool
}

// db object with both Prisma and pool for backward compatibility
export const db = {
  ...prisma,
  pool: poolProxy,
  prisma,
  query: poolProxy.query,
  execute: poolProxy.execute,
}

// Legacy getDatabaseAdapter for backward compatibility
let dbInstance: DatabaseAdapter | null = null

export function getDatabaseAdapter() {
  if (dbInstance) return dbInstance

  // Legacy ORM models (will be replaced by Prisma)
  const UserModel = require("../backend/src/database/orm/user.model.js")
  const VerificationModel = require("../backend/src/database/orm/verification.model.js")
  const NotificationModel = require("../backend/src/database/orm/notification.model.js")

  dbInstance = {
    pool: poolProxy,
    prisma, // NEW: Prisma client available
    users: UserModel,
    verifications: VerificationModel,
    notifications: NotificationModel,
    query: poolProxy.query,
    execute: poolProxy.execute,
    // Legacy getDB() method for backward compatibility with existing code
    getDB: () => poolProxy,
  }

  return dbInstance
}

// Helper to remove sensitive data from user object
export function sanitizeUser(user: User): SafeUser {
  const { password, ...safeUser } = user
  return safeUser as SafeUser
}

// Using Prisma Adapter (shimmed legacy pool)

// Default export for backward compatibility
export default db
