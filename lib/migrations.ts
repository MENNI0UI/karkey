import { getDB } from "../backend/src/database/index.js"
import { readFileSync } from "fs"
import { join } from "path"

export interface Migration {
  id: number
  name: string
  executed_at: Date
}

/**
 * إنشاء جدول لتتبع الـ migrations المنفذة
 */
async function createMigrationsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS _migrations (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `
  const db = getDB()
  await db.query(query)
}

/**
 * الحصول على قائمة الـ migrations المنفذة
 */
async function getExecutedMigrations(): Promise<string[]> {
  try {
    const db = getDB()
    const response = await db.query("SELECT name FROM _migrations ORDER BY id ASC")
    const [rows] = response as [any[], any]
    if (!Array.isArray(rows)) return []
    return rows
      .map((r: any) => (r && r.name != null ? String(r.name) : ""))
      .filter((n: string) => n !== "")
  } catch (error) {
    return []
  }
}

/**
 * تنفيذ migration واحد
 */
async function executeMigration(name: string, sql: string) {
  const db = getDB()
  let connection = null
  try {
    connection = await db.getConnection()
    await connection.beginTransaction()

    // تقسيم SQL إلى statements منفصلة
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    // تنفيذ كل statement
    for (const statement of statements) {
      await connection.execute(statement)
    }

    // تسجيل Migration
    await connection.execute("INSERT INTO _migrations (name) VALUES (?)", [name])

    await connection.commit()
    console.log(`✅ Migration executed: ${name}`)
  } catch (error) {
    // Check if connection exists before trying to rollback
    if (connection) {
      await connection.rollback()
    }
    console.error(`❌ Migration failed: ${name}`, error)
    throw error
  } finally {
    // Check if connection exists before trying to release
    if (connection) {
      connection.release()
    }
  }
}

/**
 * تنفيذ جميع الـ migrations المعلقة
 */
export async function runMigrations() {
  try {
    console.log("🔄 Starting database migrations...")

    // إنشاء جدول الـ migrations إذا لم يكن موجوداً
    await createMigrationsTable()

    // الحصول على الـ migrations المنفذة
    const executedMigrations = await getExecutedMigrations()
    console.log(`📋 Executed migrations: ${executedMigrations.length}`)

    // قائمة الـ migrations المتاحة
    const availableMigrations = [
      "001-create-database-and-tables.sql",
      "002-add-name-fields.sql",
      // ERD expansion: bids, plans, subscriptions, deposits, invoices, payments, inspections, requests, blacklists
      "003-add-erd-tables.sql",
    ]

    // تنفيذ الـ migrations المعلقة
    for (const migrationFile of availableMigrations) {
      if (!executedMigrations.includes(migrationFile)) {
        console.log(`⏳ Running migration: ${migrationFile}`)

        const migrationPath = join(process.cwd(), "scripts", migrationFile)
        const sql = readFileSync(migrationPath, "utf-8")

        await executeMigration(migrationFile, sql)
      } else {
        console.log(`⏭️  Skipping migration (already executed): ${migrationFile}`)
      }
    }

    console.log("✅ All migrations completed successfully!")
    return { success: true, message: "All migrations completed" }
  } catch (error) {
    console.error("❌ Migration error:", error)
    throw error
  }
}

/**
 * إعادة تعيين قاعدة البيانات (حذف كل الجداول)
 * تحذير: هذا سيحذف جميع البيانات!
 */
export async function resetDatabase() {
  const db = getDB()
  let connection = null
  try {
    connection = await db.getConnection()
    await connection.beginTransaction()

    // تعطيل foreign key checks
    await connection.execute("SET FOREIGN_KEY_CHECKS = 0")

    // حذف جميع الجداول
    await connection.execute("DROP TABLE IF EXISTS _migrations")
    await connection.execute("DROP TABLE IF EXISTS verifications")
    await connection.execute("DROP TABLE IF EXISTS users")

    // تفعيل foreign key checks
    await connection.execute("SET FOREIGN_KEY_CHECKS = 1")

    await connection.commit()
    console.log("✅ Database reset successfully")
    return { success: true, message: "Database reset successfully" }
  } catch (error) {
    // Check if connection exists before trying to rollback
    if (connection) {
      await connection.rollback()
    }
    console.error("❌ Database reset failed:", error)
    throw error
  } finally {
    // Check if connection exists before trying to release
    if (connection) {
      connection.release()
    }
  }
}
