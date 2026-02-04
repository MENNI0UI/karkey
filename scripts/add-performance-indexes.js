/**
 * Add performance indexes to the database
 * Run with: node scripts/add-performance-indexes.js
 */

const path = require('node:path');
const fs = require('fs');
const dotenv = require('dotenv');

const mysql = require('mysql2/promise');

// Build absolute path to .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

async function main() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'karkey',
    port: Number.parseInt(process.env.DB_PORT || '3306', 10),
  };

  console.log('🔧 Adding performance indexes to database...\n');

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);

    // Helper function to safely add index
    async function addIndex(table, indexName, columns, type = 'INDEX') {
      try {
        // Check if index already exists
        const [existing] = await connection.query(
          `SHOW INDEX FROM ${table} WHERE Key_name = ?`,
          [indexName]
        );

        if (existing.length > 0) {
          console.log(`  ⏭️  ${indexName} already exists on ${table}`);
          return;
        }

        await connection.query(`CREATE ${type} ${indexName} ON ${table}(${columns})`);
        console.log(`  ✅ Created ${indexName} on ${table}(${columns})`);
      } catch (err) {
        if (err.code === 'ER_DUP_KEYNAME') {
          console.log(`  ⏭️  ${indexName} already exists on ${table}`);
        } else if (err.code === 'ER_NO_SUCH_TABLE') {
          console.log(`  ⚠️  Table ${table} does not exist, skipping ${indexName}`);
        } else {
          console.error(`  ❌ Failed to create ${indexName}: ${err.message}`);
        }
      }
    }

    console.log('📦 Direct Sales ( & Auctions) table indexes:');
    // Common filters
    await addIndex('direct_sales', 'idx_ds_make_model', 'make, model');
    await addIndex('direct_sales', 'idx_ds_year', 'year');
    await addIndex('direct_sales', 'idx_ds_price_loc', 'price, location');

    // Status & Filtering
    await addIndex('direct_sales', 'idx_ds_status_composite', 'sale_status, verification_status');
    await addIndex('direct_sales', 'idx_ds_verification', 'verification_status');
    await addIndex('direct_sales', 'idx_ds_sale_status', 'sale_status');

    // Auction specific
    await addIndex('direct_sales', 'idx_ds_auction_status', 'auction_status');
    await addIndex('direct_sales', 'idx_ds_auction_end', 'auction_end_date');
    await addIndex('direct_sales', 'idx_ds_auction_lookup', 'auction_status, auction_end_date');

    console.log('\n📦 Karkey Cars (Admin Listings) table indexes:');
    await addIndex('karkey_cars', 'idx_kc_make_model', 'make, model');
    await addIndex('karkey_cars', 'idx_kc_price', 'price');
    await addIndex('karkey_cars', 'idx_kc_active_created', 'is_active, created_at DESC');

    console.log('\n📦 Users table indexes:');
    // Most user lookups are by ID (PK) or email (Unique), but we might filter by type
    await addIndex('users', 'idx_users_type', 'user_type');
    await addIndex('users', 'idx_users_created', 'created_at');

    console.log('\n📦 Notifications table indexes:');
    await addIndex('notifications', 'idx_notif_user_read', 'user_id, is_read');

    console.log('\n🔄 Analyzing tables...');
    // Removed 'showroom' as it does not exist in the current schema
    const tables = ['direct_sales', 'karkey_cars', 'users', 'notifications'];
    for (const table of tables) {
      try {
        await connection.query(`ANALYZE TABLE ${table}`);
        console.log(`  ✅ Analyzed ${table}`);
      } catch (err) {
        console.log(`  ⚠️  Could not analyze ${table}: ${err.message}`);
      }
    }

    console.log('\n✨ Performance indexes update complete!');
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the script
main().catch((err) => {
  console.error('❌ Fatal Error:', err);
  process.exit(1);
});
