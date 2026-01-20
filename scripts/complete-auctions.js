#!/usr/bin/env node
const mysql = require('mysql2/promise')

async function updateAuctionStatuses() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'karkey',
    waitForConnections: true,
    connectionLimit: 10,
  })

  try {
    console.log('[complete-auctions] running status updates')
    // activate auctions whose start_date <= now() and not completed
    await pool.query(`
      UPDATE auctions
      SET status = 'active'
      WHERE status != 'active' AND status != 'completed' AND start_date <= NOW() AND end_date > NOW()
    `)

    // mark ended auctions as completed
    await pool.query(`
      UPDATE auctions
      SET status = 'completed'
      WHERE status != 'completed' AND end_date <= NOW()
    `)

    console.log('[complete-auctions] status updates finished')
  } catch (err) {
    console.error('[complete-auctions] error running updates:', err)
    process.exitCode = 2
  } finally {
    try { await pool.end() } catch (e) {}
  }
}

if (require.main === module) {
  // run once and exit; intended to be scheduled (cron/systemd) or invoked periodically
  updateAuctionStatuses().then(() => process.exit(0)).catch(() => process.exit(1))
}

module.exports = { updateAuctionStatuses }
