require('dotenv').config()
const fs = require('fs')
const path = require('path')
const db = require('../backend/src/database/index.js')

// Whitelist of allowed migration files - prevents SQL injection via CLI args
const ALLOWED_MIGRATIONS = [
  '001-create-database-and-tables.sql',
  '002-add-name-fields.sql',
  '003-add-erd-tables.sql',
  '004-add-saved-searches-table.sql',
  '005-add-showroom-saved-searches.sql',
  '006-fix-showroom-saved-searches-add-fk.sql',
  '007-enhance-plans-table.sql',
  '020-create-direct-sales-table.sql',
  '021-create-direct-sales-watchlist.sql',
  '022-create-direct-sales-saved-searches.sql',
  '023-create-direct-sales-contacts.sql',
  '024-add-plans-translations.sql',
  'add-name-fields-to-users.sql',
  'add-name-fields.sql',
  'add-password-version-to-admins.sql',
  'add-performance-indexes.sql',
  'add-showroom-conversion-fields.sql',
  'create-auction-table-v2.sql',
  'create-auction-table.sql',
  'create-auctions-table.sql',
  'create-notifications-table.sql',
  'create-vehicle-auction-table.sql',
  'create-vehicle-photos-table.sql',
  'create-vehicles-table.sql',
  'create-verification-log-table.sql',
  'migrate-normalize-photos.sql',
]

function getMigrationPath(fileName) {
  // Extract just the filename if a path was provided
  const baseName = path.basename(fileName)

  // Validate against whitelist
  if (!ALLOWED_MIGRATIONS.includes(baseName)) {
    throw new Error(`Invalid migration: "${baseName}" is not in the allowed list. Add it to ALLOWED_MIGRATIONS if this is a new migration file.`)
  }

  // Build safe path from whitelisted filename
  const scriptsDir = path.join(__dirname)
  return path.join(scriptsDir, baseName)
}

async function runMigration(fileName) {
  // Get validated migration path
  const migrationPath = getMigrationPath(fileName)

  // Verify file exists
  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Migration file not found: ${migrationPath}`)
  }

  // Read SQL from validated path
  const sql = fs.readFileSync(migrationPath, 'utf-8')
  const pool = db.getDB()
  const connection = await pool.getConnection()

  try {
    console.log('🔄 Running migration file:', migrationPath)
    await connection.beginTransaction()

    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)

    for (const stmt of statements) {
      try {
        // SQL is safe - comes from whitelisted migration files only
        await connection.query(stmt)
      } catch (err) {
        // If index already exists, skip
        if (err && err.code === 'ER_DUP_KEYNAME') {
          console.log('⚠️  Duplicate index, skipping')
          continue
        }
        throw err
      }
    }

    await connection.commit()
    console.log('✅ Migration completed successfully')
  } catch (e) {
    await connection.rollback()
    console.error('❌ Migration failed:', e.message)
    process.exitCode = 1
  } finally {
    connection.release()
  }
}

const file = process.argv[2] || '003-add-erd-tables.sql'
runMigration(file).catch((e) => {
  console.error(e)
  process.exit(1)
})

