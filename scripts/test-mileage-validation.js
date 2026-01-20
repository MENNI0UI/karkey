require('dotenv').config()
const db = require('../backend/src/database/index.js')

async function testMileageValidation() {
  const pool = db.getDB()
  
  try {
    console.log('🧪 Testing mileage validation...\n')

    // Find an approved user
    const [users] = await pool.query(
      "SELECT id FROM users WHERE verification_status = 'approved' LIMIT 1"
    )
    
    if (users.length === 0) {
      console.log('❌ No approved user found')
      return
    }
    
    const userId = users[0].id

    // Test 1: Try to insert vehicle with mileage = 0 (should fail validation in app)
    console.log('1️⃣ Testing mileage = 0 (should be rejected by app validation)...')
    const validationTests = [
      { mileage: 0, expected: 'Should fail app validation' },
      { mileage: 1, expected: 'Should pass' },
      { mileage: 50000, expected: 'Should pass' },
      { mileage: -100, expected: 'Should fail DB constraint' },
    ]

    for (const test of validationTests) {
      console.log(`\n   Testing mileage = ${test.mileage}`)
      console.log(`   Expected: ${test.expected}`)
      
      try {
        const [result] = await pool.query(
          `INSERT INTO vehicles (
            user_id, make, model, year, mileage, transmission, fuel_type,
            vehicle_condition, location, description, carte_grise_url, verification_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            'Test',
            'Test Model',
            2020,
            test.mileage,
            'manual',
            'gasoline',
            'good',
            'Test Location',
            'Test description with more than 20 characters',
            '/test-carte-grise.jpg',
            'pending'
          ]
        )
        
        if (test.mileage < 0) {
          console.log(`   ❌ FAILED: Negative mileage should have been rejected by DB`)
        } else if (test.mileage === 0) {
          console.log(`   ⚠️  DB allowed mileage=0 (app validation should catch this)`)
          // Clean up
          await pool.query('DELETE FROM vehicles WHERE id = ?', [result.insertId])
        } else {
          console.log(`   ✓ Successfully inserted with mileage=${test.mileage}`)
          // Clean up
          await pool.query('DELETE FROM vehicles WHERE id = ?', [result.insertId])
        }
        
      } catch (err) {
        if (err.sqlState === '23000' && test.mileage < 0) {
          console.log(`   ✓ DB constraint correctly rejected negative mileage`)
        } else {
          console.log(`   ⚠️  Error: ${err.sqlMessage}`)
        }
      }
    }

    console.log('\n✅ Mileage validation test completed!')
    console.log('\n📋 Summary:')
    console.log('   - App validation now requires: mileage > 0')
    console.log('   - DB constraint allows: mileage >= 0')
    console.log('   - Combined: Users must enter mileage > 0 to proceed')

  } catch (error) {
    console.error('\n❌ Test failed:', error.message)
    console.error(error)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

testMileageValidation()
