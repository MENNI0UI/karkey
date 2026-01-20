const mysql = require("mysql2/promise")
require("dotenv").config()

async function addProfilePictureColumn() {
  let connection

  try {
    console.log("🔄 Connecting to database...")
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "karkey",
    })

    console.log("✅ Connected to database")

    // Add profile_picture column to users table
    console.log("🔄 Adding profile_picture column to users table...")
    await connection.execute(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS profile_picture VARCHAR(500) NULL AFTER phone_number
    `)
    console.log("✅ profile_picture column added successfully")

    console.log("\n✅ Migration completed successfully!")
  } catch (error) {
    console.error("❌ Error:", error.message)
    throw error
  } finally {
    if (connection) {
      await connection.end()
      console.log("🔌 Database connection closed")
    }
  }
}

addProfilePictureColumn()
