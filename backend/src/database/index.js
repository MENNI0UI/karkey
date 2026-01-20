// ============================================
// ملف الاتصال بقاعدة البيانات (Backend)
// ============================================
// تم تحديثه لاستخدام Prisma بدلاً من mysql2 لتوحيد الاتصال
// ============================================

const { PrismaClient } = require("@prisma/client")

// Reuse global Prisma instance if available (to match frontend/Next.js behavior)
let prisma
if (global.prisma) {
  prisma = global.prisma
  console.info("[backend/db] Reusing global Prisma instance")
} else {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
  if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma
  }
  console.info("[backend/db] Created new Prisma instance")
}

// Shimming the Pool object to support legacy backend code
const poolShim = {
  query: async (sql, params = []) => {
    try {
      const result = await prisma.$queryRawUnsafe(sql, ...params)
      return [result, undefined] // [rows, fields]
    } catch (err) {
      console.error(`[backend/db] QUERY ERROR. SQL: ${sql.slice(0, 100)}...`, err.message)
      throw err
    }
  },
  execute: async (sql, params = []) => {
    try {
      const result = await prisma.$executeRawUnsafe(sql, ...params)
      return [{ affectedRows: result }, undefined]
    } catch (err) {
      console.error(`[backend/db] EXECUTE ERROR. SQL: ${sql.slice(0, 100)}...`, err.message)
      throw err
    }
  },
  // Dummy connection object
  getConnection: async () => {
    return {
      release: () => { },
      query: (sql, params) => poolShim.query(sql, params),
      execute: (sql, params) => poolShim.execute(sql, params),
      beginTransaction: async () => { /* Not supported in shim yet, hopefully not used */ },
      commit: async () => { },
      rollback: async () => { },
    }
  },
  end: async () => {
    // await prisma.$disconnect()
  },
  // Stats - mocked
  _allConnections: [],
  _freeConnections: [],
  _connectionQueue: [],
  config: { connectionLimit: 10 }
}

// Helper functions exported by original file
async function query(sql, params = []) {
  return await poolShim.query(sql, params)
}

async function execute(sql, params = []) {
  return await poolShim.execute(sql, params)
}

async function queryOne(sql, params = []) {
  const [rows] = await query(sql, params)
  return rows && rows.length > 0 ? rows[0] : null
}

async function testConnection() {
  try {
    await prisma.$queryRawUnsafe("SELECT 1")
    return true
  } catch (error) {
    console.error("فشل الاتصال بقاعدة البيانات:", error)
    return false
  }
}

async function closeConnection() {
  // await prisma.$disconnect()
}

function getPoolStats() {
  return {
    totalConnections: 1, // Mocked
    freeConnections: 1,
    connectionLimit: 10,
    queueLength: 0,
    note: "Managed by Prisma"
  }
}

async function monitorConnections() {
  console.log("=== Database Pool Stats (Prisma) ===")
  console.log("Managed by Prisma Client (Internal Pool)")
  console.log("==========================")
}

module.exports = {
  getDB: () => poolShim,
  pool: poolShim,
  query,
  queryOne,
  execute,
  testConnection,
  closeConnection,
  getPoolStats,
  monitorConnections,
  config: poolShim.config,
}
