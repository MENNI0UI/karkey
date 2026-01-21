require('dotenv').config()
const db = require('../backend/src/database/index.js')

async function verify() {
    const pool = db.getDB()
    try {
        const [rows] = await pool.query(
            "SELECT id, make, model, interior_color, exterior_color, is_original_paint FROM vehicles ORDER BY id DESC LIMIT 1"
        )
        if (rows && rows.length > 0) {
            console.log('Last Vehicle:', rows[0])
        } else {
            console.log('No vehicles found.')
        }
    } catch (err) {
        console.error(err)
    } finally {
        process.exit(0)
    }
}

verify()
