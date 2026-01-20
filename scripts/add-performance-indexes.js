/**
 * Add performance indexes to the database
 * Run with: node scripts/add-performance-indexes.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const mysql = require('mysql2/promise');

async function main() {
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'karkey',
    port: parseInt(process.env.DB_PORT || '3306', 10),
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

    console.log('📦 Vehicles table indexes:');
    await addIndex('vehicles', 'idx_vehicles_make', 'make');
    await addIndex('vehicles', 'idx_vehicles_model', 'model');
    await addIndex('vehicles', 'idx_vehicles_year', 'year');
    await addIndex('vehicles', 'idx_vehicles_fuel_type', 'fuel_type');
    await addIndex('vehicles', 'idx_vehicles_transmission', 'transmission');
    await addIndex('vehicles', 'idx_vehicles_mileage', 'mileage');
    await addIndex('vehicles', 'idx_vehicles_engine_size', 'engine_size');
    await addIndex('vehicles', 'idx_vehicles_doors', 'doors');
    await addIndex('vehicles', 'idx_vehicles_vehicle_condition', 'vehicle_condition');
    await addIndex('vehicles', 'idx_vehicles_verification_created', 'verification_status, created_at DESC');
    await addIndex('vehicles', 'idx_vehicles_make_model', 'make, model');

    console.log('\n📦 Auctions table indexes:');
    await addIndex('auctions', 'idx_auctions_vehicle_status', 'vehicle_id, status');
    await addIndex('auctions', 'idx_auctions_status_dates', 'status, start_date, end_date');
    await addIndex('auctions', 'idx_auctions_starting_price', 'starting_price');
    await addIndex('auctions', 'idx_auctions_vehicle_active_created', 'vehicle_id, status, created_at DESC');

    console.log('\n📦 Direct sales table indexes:');
    await addIndex('direct_sales', 'idx_direct_sales_verification_sale', 'verification_status, sale_status');
    await addIndex('direct_sales', 'idx_direct_sales_make', 'make');
    await addIndex('direct_sales', 'idx_direct_sales_model', 'model');
    await addIndex('direct_sales', 'idx_direct_sales_year', 'year');
    await addIndex('direct_sales', 'idx_direct_sales_fuel_type', 'fuel_type');
    await addIndex('direct_sales', 'idx_direct_sales_transmission', 'transmission');
    await addIndex('direct_sales', 'idx_direct_sales_price', 'price');
    await addIndex('direct_sales', 'idx_direct_sales_vehicle_condition', 'vehicle_condition');

    console.log('\n📦 Vehicle photos table indexes:');
    await addIndex('vehicle_photos', 'idx_vehicle_photos_vehicle_order', 'vehicle_id, position_order');

    console.log('\n📦 Direct sale photos table indexes:');
    await addIndex('direct_sale_photos', 'idx_direct_sale_photos_order', 'direct_sale_id, position_order');

    console.log('\n📦 Users table indexes:');
    await addIndex('users', 'idx_users_verification', 'verification_status');
    await addIndex('users', 'idx_users_type_verification', 'user_type, verification_status');

    console.log('\n📦 Notifications table indexes:');
    await addIndex('notifications', 'idx_notifications_user_read', 'user_id, is_read');
    await addIndex('notifications', 'idx_notifications_user_created', 'user_id, created_at DESC');

    console.log('\n📦 Bids table indexes:');
    await addIndex('bids', 'idx_bids_auction_created', 'auction_id, created_at DESC');
    await addIndex('bids', 'idx_bids_user_auction', 'user_id, auction_id');

    console.log('\n🔄 Analyzing tables...');
    const tables = ['vehicles', 'auctions', 'direct_sales', 'vehicle_photos', 'users', 'notifications', 'bids', 'direct_sale_photos'];
    for (const table of tables) {
      try {
        await connection.query(`ANALYZE TABLE ${table}`);
        console.log(`  ✅ Analyzed ${table}`);
      } catch (err) {
        if (err.code !== 'ER_NO_SUCH_TABLE') {
          console.log(`  ⚠️  Could not analyze ${table}: ${err.message}`);
        }
      }
    }

    console.log('\n✨ Performance indexes added successfully!');
    console.log('\n📊 These indexes will improve:');
    console.log('   • Vehicle search and filtering queries');
    console.log('   • Auction listing performance');
    console.log('   • Direct sales browsing speed');
    console.log('   • User verification lookups');
    console.log('   • Notification loading times');

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main();
