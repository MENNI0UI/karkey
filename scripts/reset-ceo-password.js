// Reset CEO password
// Run: node scripts/reset-ceo-password.js

const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
require('dotenv').config({ path: '.env.local' })

async function resetCEOPassword() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'karkey',
  })

  try {
    // Password must be provided as CLI argument or environment variable
    const newPassword = process.argv[2] || process.env.CEO_NEW_PASSWORD
    if (!newPassword) {
      console.error('❌ Please provide a password as argument: node scripts/reset-ceo-password.js <new_password>')
      console.error('   Or set CEO_NEW_PASSWORD environment variable')
      process.exit(1)
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update CEO password
    const [result] = await pool.query(
      "UPDATE admins SET password_hash = ? WHERE role = 'ceo'",
      [hashedPassword]
    )

    if (result.affectedRows > 0) {
      console.log('✅ CEO password has been reset!')
      console.log('')
      console.log('New login credentials:')
      console.log('------------------------')

      // Get CEO info
      const [admins] = await pool.query("SELECT nom, prenom FROM admins WHERE role = 'ceo'")
      if (admins.length > 0) {
        console.log(`Last Name (Nom): ${admins[0].nom}`)
        console.log(`First Name (Prénom): ${admins[0].prenom}`)
      }
      console.log(`Password: ${newPassword}`)
      console.log('')
      console.log('⚠️  Please change this password after logging in!')
    } else {
      console.log('❌ No CEO found in database')
    }
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await pool.end()
  }
}

resetCEOPassword()
