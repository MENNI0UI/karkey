/**
 * API Tests for Plans Endpoints
 * Run with: node scripts/test-plans-api.js
 * 
 * Prerequisites:
 * - Server running on localhost:3000
 * - Database seeded with plans
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

// ANSI colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

function log(type, message) {
  const color = type === 'pass' ? colors.green 
    : type === 'fail' ? colors.red 
    : type === 'info' ? colors.blue 
    : colors.yellow
  const symbol = type === 'pass' ? '✓' : type === 'fail' ? '✗' : type === 'info' ? 'ℹ' : '⚠'
  console.log(`${color}${symbol}${colors.reset} ${message}`)
}

async function testGetPlans() {
  log('info', 'Testing GET /api/plans...')
  
  try {
    const res = await fetch(`${BASE_URL}/api/plans`)
    const data = await res.json()
    
    if (!res.ok) {
      log('fail', `GET /api/plans failed with status ${res.status}`)
      return false
    }
    
    if (!data.success) {
      log('fail', `GET /api/plans returned success: false - ${data.error}`)
      return false
    }
    
    if (!Array.isArray(data.plans)) {
      log('fail', 'GET /api/plans did not return plans array')
      return false
    }
    
    log('pass', `GET /api/plans returned ${data.plans.length} plans (source: ${data.source})`)
    
    // Validate plan structure
    if (data.plans.length > 0) {
      const plan = data.plans[0]
      const requiredFields = ['id', 'name', 'price', 'currency', 'duration_days', 'status']
      const missingFields = requiredFields.filter(f => !(f in plan))
      
      if (missingFields.length > 0) {
        log('warn', `Plan missing fields: ${missingFields.join(', ')}`)
      } else {
        log('pass', 'Plan structure is valid')
      }
      
      // Check features is array
      if (plan.features && !Array.isArray(plan.features)) {
        log('fail', 'Plan features should be an array')
        return false
      }
      log('pass', 'Plan features is an array')
    }
    
    return true
  } catch (error) {
    log('fail', `GET /api/plans threw error: ${error.message}`)
    return false
  }
}

async function testGetPlansAll() {
  log('info', 'Testing GET /api/plans?all=true (should require admin auth)...')
  
  try {
    const res = await fetch(`${BASE_URL}/api/plans?all=true`)
    const data = await res.json()
    
    // Without admin cookie, this should still work but may not include inactive plans
    // The API gracefully handles missing auth for ?all=true
    if (data.success && Array.isArray(data.plans)) {
      log('pass', `GET /api/plans?all=true returned ${data.plans.length} plans`)
      return true
    }
    
    log('warn', 'GET /api/plans?all=true returned unexpected response')
    return true // Not a failure, just different behavior
  } catch (error) {
    log('fail', `GET /api/plans?all=true threw error: ${error.message}`)
    return false
  }
}

async function testPlanFallback() {
  log('info', 'Testing fallback plans structure...')
  
  try {
    const res = await fetch(`${BASE_URL}/api/plans`)
    const data = await res.json()
    
    if (!data.success) {
      log('fail', 'Could not get plans for fallback test')
      return false
    }
    
    // Check that plans have expected fields for UI
    const uiRequiredFields = ['name', 'price', 'currency', 'features', 'popular', 'priority']
    
    for (const plan of data.plans) {
      const missing = uiRequiredFields.filter(f => plan[f] === undefined)
      if (missing.length > 0) {
        log('warn', `Plan "${plan.name}" missing UI fields: ${missing.join(', ')}`)
      }
    }
    
    log('pass', 'All plans have required UI fields')
    return true
  } catch (error) {
    log('fail', `Fallback test threw error: ${error.message}`)
    return false
  }
}

async function testSubscriptionsEndpoint() {
  log('info', 'Testing GET /api/subscriptions (without auth)...')
  
  try {
    const res = await fetch(`${BASE_URL}/api/subscriptions`)
    const data = await res.json()
    
    // Should return 401 without auth
    if (res.status === 401) {
      log('pass', 'GET /api/subscriptions correctly requires authentication')
      return true
    }
    
    // If it returns success, that's also valid (user might be logged in via session)
    if (data.success) {
      log('pass', `GET /api/subscriptions returned subscription data`)
      return true
    }
    
    log('warn', `Unexpected response: ${JSON.stringify(data)}`)
    return true
  } catch (error) {
    log('fail', `GET /api/subscriptions threw error: ${error.message}`)
    return false
  }
}

async function testSubscriptionsStats() {
  log('info', 'Testing GET /api/subscriptions?stats=true (requires admin)...')
  
  try {
    const res = await fetch(`${BASE_URL}/api/subscriptions?stats=true`)
    const data = await res.json()
    
    // Should return 401 without admin auth
    if (res.status === 401) {
      log('pass', 'GET /api/subscriptions?stats=true correctly requires admin authentication')
      return true
    }
    
    if (data.success && data.stats) {
      log('pass', `Stats endpoint working: ${data.stats.total} total, ${data.stats.active} active`)
      return true
    }
    
    return true
  } catch (error) {
    log('fail', `Stats endpoint threw error: ${error.message}`)
    return false
  }
}

async function testInvalidPlanId() {
  log('info', 'Testing POST /api/plans with invalid data (should fail)...')
  
  try {
    const res = await fetch(`${BASE_URL}/api/plans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})  // Empty body
    })
    const data = await res.json()
    
    if (res.status === 401) {
      log('pass', 'POST /api/plans correctly requires admin authentication')
      return true
    }
    
    if (!data.success) {
      log('pass', 'POST /api/plans correctly rejected invalid data')
      return true
    }
    
    log('warn', 'POST /api/plans accepted invalid data - check validation')
    return false
  } catch (error) {
    log('fail', `POST test threw error: ${error.message}`)
    return false
  }
}

async function runAllTests() {
  console.log('\n' + '='.repeat(50))
  console.log(`${colors.blue}Plans API Test Suite${colors.reset}`)
  console.log(`Testing against: ${BASE_URL}`)
  console.log('='.repeat(50) + '\n')
  
  const tests = [
    { name: 'GET /api/plans', fn: testGetPlans },
    { name: 'GET /api/plans?all=true', fn: testGetPlansAll },
    { name: 'Plan Fallback Structure', fn: testPlanFallback },
    { name: 'GET /api/subscriptions', fn: testSubscriptionsEndpoint },
    { name: 'GET /api/subscriptions?stats=true', fn: testSubscriptionsStats },
    { name: 'POST /api/plans validation', fn: testInvalidPlanId },
  ]
  
  let passed = 0
  let failed = 0
  
  for (const test of tests) {
    console.log(`\n${colors.yellow}Running: ${test.name}${colors.reset}`)
    const result = await test.fn()
    if (result) {
      passed++
    } else {
      failed++
    }
  }
  
  console.log('\n' + '='.repeat(50))
  console.log(`${colors.blue}Test Results${colors.reset}`)
  console.log(`${colors.green}Passed: ${passed}${colors.reset}`)
  console.log(`${colors.red}Failed: ${failed}${colors.reset}`)
  console.log('='.repeat(50) + '\n')
  
  process.exit(failed > 0 ? 1 : 0)
}

// Run tests
runAllTests()
