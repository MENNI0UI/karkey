// Create verification_log table
// Run: node scripts/create-verification-log.js

const mysql = require('mysql2/promise')
require('dotenv').config({ path: '.env.local' })

async function createVerificationLogTable() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'karkey',
  })

  try {
    console.log('Creating verification_log table...')
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        entity_type ENUM('user', 'vehicle') NOT NULL,
        entity_id INT NOT NULL,
        action ENUM('approved', 'rejected') NOT NULL,
        reason VARCHAR(500) NULL,
        admin_id INT NOT NULL,
        admin_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        INDEX idx_verification_log_entity (entity_type, entity_id),
        INDEX idx_verification_log_admin (admin_id),
        INDEX idx_verification_log_action (action),
        INDEX idx_verification_log_date (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    
    console.log('✅ verification_log table created successfully!')
  } catch (error) {
    console.error('Error:', error.message)
  } finally {
    await pool.end()
  }
}

createVerificationLogTable()
