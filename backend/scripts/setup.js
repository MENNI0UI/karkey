// ============================================
// سكريبت إعداد قاعدة البيانات
// ============================================

require("dotenv").config()
const fs = require("fs")
const path = require("path")
const mysql = require("mysql2/promise")

async function setup() {
  let connection

  try {
    console.log("🔧 بدء إعداد قاعدة البيانات...")

    // الاتصال بـ MySQL بدون تحديد قاعدة بيانات
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: Number.parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      multipleStatements: true,
    })

    console.log("✅ تم الاتصال بـ MySQL")

    // قراءة ملف schema.sql
    const schemaPath = path.join(__dirname, "../src/database/schema.sql")
    const schema = fs.readFileSync(schemaPath, "utf8")

    try {
      await connection.query(schema)
      console.log("✅ تم إنشاء قاعدة البيانات والجداول بنجاح")
    } catch (error) {
      // تجاهل خطأ الـ index المكرر فقط
      if (error.code === "ER_DUP_KEYNAME") {
        console.log("⚠️  الـ indexes موجودة مسبقاً - تم التجاوز")
        console.log("✅ قاعدة البيانات جاهزة")
      } else {
        throw error
      }
    }

    console.log("🎉 الإعداد مكتمل!")
  } catch (error) {
    console.error("❌ خطأ في إعداد قاعدة البيانات:", error)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

setup()
