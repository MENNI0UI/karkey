const db = require('../backend/src/database');

async function addBirthdayColumn() {
  try {
    console.log('Adding birthday column to users table...');
    
    await db.query(`
      ALTER TABLE users 
      ADD COLUMN birthday DATE NULL 
      AFTER last_name
    `);
    
    console.log('✅ Birthday column added successfully!');
    
    // Verify
    const result = await db.query('DESCRIBE users');
    const birthdayColumn = result.find(col => col.Field === 'birthday');
    
    if (birthdayColumn) {
      console.log('\n✅ Verified: Birthday column exists');
      console.log('Column details:', birthdayColumn);
    }
    
    process.exit(0);
  } catch (error) {
    if (error.code === 'ER_DUP_FIELDNAME') {
      console.log('⚠️  Birthday column already exists');
      process.exit(0);
    } else {
      console.error('❌ Error adding birthday column:', error.message);
      process.exit(1);
    }
  }
}

addBirthdayColumn();
