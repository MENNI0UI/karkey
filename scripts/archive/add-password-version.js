// Add password_version column to admins table
// Run this script: node scripts/add-password-version.js

const mysql = require('mysql2/promise')
require('dotenv').config({ path: '.env.local' })

async function addPasswordVersion() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'karkey',
  })

  try {
    console.log('Adding password_version column to admins table...')
    
    // Check if column exists
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'admins' AND COLUMN_NAME = 'password_version'
    `, [process.env.DB_NAME || 'karkey'])
    
    if (columns.length > 0) {
      console.log('✅ Column password_version already exists')
    } else {
      await pool.query(`
        ALTER TABLE admins 
        ADD COLUMN password_version INT DEFAULT 1 NOT NULL
      `)
      console.log('✅ Added password_version column')
      
      // Set default value for existing admins
      await pool.query('UPDATE admins SET password_version = 1 WHERE password_version IS NULL')
      console.log('✅ Set default password_version = 1 for existing admins')
    }
    
    console.log('✅ Done!')
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await pool.end()
  }
}

addPasswordVersion()
