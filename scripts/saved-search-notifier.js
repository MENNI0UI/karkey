#!/usr/bin/env node
/*
  saved-search-notifier.js
  Run periodically (cron) to find new auctions matching saved searches and insert notifications.
  Usage: node scripts/saved-search-notifier.js
*/
const mysql = require('mysql2/promise')

async function main() {
  const host = process.env.DB_HOST || 'localhost'
  const port = Number(process.env.DB_PORT || 3306)
  const user = process.env.DB_USER || 'root'
  const password = process.env.DB_PASSWORD || ''
  const database = process.env.DB_NAME || 'karkey'

  const pool = mysql.createPool({ host, port, user, password: password === '' ? undefined : password, database, waitForConnections: true, connectionLimit: 5 })
  try {
    // Fetch active saved searches
    const [saved] = await pool.query('SELECT id, user_id, name, params, last_notified_at FROM saved_searches WHERE is_active = 1')
    const savedArr = Array.isArray(saved) ? saved : []

    for (const s of savedArr) {
      let params = {}
      try { params = typeof s.params === 'string' ? JSON.parse(s.params) : s.params || {} } catch { params = {} }

      // Build where clauses
      const where = ['1=1']
      const values = []
      if (params.make) { where.push('v.make = ?'); values.push(params.make) }
      if (params.model) { where.push('v.model = ?'); values.push(params.model) }
      if (params.year) { where.push('v.year = ?'); values.push(Number(params.year)) }
      if (params.fuel) { where.push('v.fuel_type = ?'); values.push(params.fuel) }
      if (params.condition) { where.push('v.`condition` = ?'); values.push(params.condition) }
      if (params.minPrice) { where.push('(v.price_start >= ? OR v.reserve_price >= ?)'); values.push(Number(params.minPrice)); values.push(Number(params.minPrice)) }
      if (params.maxPrice) { where.push('(v.price_start <= ? OR (v.reserve_price IS NOT NULL AND v.reserve_price <= ?))'); values.push(Number(params.maxPrice)); values.push(Number(params.maxPrice)) }
      if (params.minMileage) { where.push('v.mileage >= ?'); values.push(Number(params.minMileage)) }
      if (params.maxMileage) { where.push('v.mileage <= ?'); values.push(Number(params.maxMileage)) }

      // Only new auctions after last_notified_at (or last 24h)
      const since = s.last_notified_at ? new Date(s.last_notified_at) : new Date(Date.now() - 24 * 3600 * 1000)
      where.push('a.created_at > ?'); values.push(since)

      const sql = `SELECT a.id as auction_id, v.id as vehicle_id, v.make, v.model, v.year, v.price_start, a.created_at FROM auctions a JOIN vehicles v ON a.vehicle_id = v.id WHERE ${where.join(' AND ')} LIMIT 100`
      const [matches] = await pool.query(sql, values)
      const matchedArr = Array.isArray(matches) ? matches : []
      if (matchedArr.length === 0) {
        // update last_notified_at to avoid repeated checks
        await pool.execute('UPDATE saved_searches SET last_notified_at = NOW() WHERE id = ?', [s.id])
        continue
      }

      for (const m of matchedArr) {
        try {
          // Use translation key format for client-side translation
          const vehicleLabel = `${m.make} ${m.model} (${m.year})`;
          const title = `__t:notifications.saved_search_title|name=${s.name}`;
          const message = `__t:notifications.saved_search_message|vehicle=${vehicleLabel}`;
          await pool.execute('INSERT INTO notifications (user_id, auction_id, title, message, type, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, NOW())', [s.user_id, m.auction_id, title, message, 'saved_search_match'])
        } catch (e) {
          console.error('Failed to insert notification for saved search', s.id, e?.message || e)
        }
      }

      // update last_notified_at after processing
      await pool.execute('UPDATE saved_searches SET last_notified_at = NOW() WHERE id = ?', [s.id])
    }

    console.log('saved-search-notifier: done')
  } catch (err) {
    console.error('saved-search-notifier error', err)
  } finally {
    try { await pool.end() } catch {}
  }
}

if (require.main === module) {
  main().catch(e => { console.error(e); process.exit(1) })
}
