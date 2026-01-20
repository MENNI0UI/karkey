// ============================================
// سكريبت إعادة تعيين قاعدة البيانات
// ============================================

require("dotenv").config()
const readline = require("readline")
const mysql = require("mysql2/promise")

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve))
}

async function reset() {
  let connection

  try {
    const answer = await question("⚠️  هل أنت متأكد من إعادة تعيين قاعدة البيانات؟ سيتم حذف جميع البيانات! (yes/no): ")

    if (answer.toLowerCase() !== "yes") {
      console.log("❌ تم إلغاء العملية")
      rl.close()
      return
    }

    console.log("🔧 بدء إعادة تعيين قاعدة البيانات...")

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: Number.parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
    })

    const dbName = process.env.DB_NAME || "karkey"

    // حذف قاعدة البيانات
    await connection.query(`DROP DATABASE IF EXISTS ${dbName}`)
    console.log("✅ تم حذف قاعدة البيانات القديمة")

    console.log("💡 الآن قم بتشغيل: npm run db:setup لإنشاء قاعدة البيانات من جديد")
  } catch (error) {
    console.error("❌ خطأ في إعادة تعيين قاعدة البيانات:", error)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
    rl.close()
  }
}

reset()
