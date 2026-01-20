const bcrypt = require("bcryptjs")
const mysql = require("mysql2/promise")
const readline = require("readline")
require("dotenv").config({ path: ".env.local" })

function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      resolve(answer)
    })
  })
}

async function createAdmin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })

  console.log("✓ Connected to database")

  // Admin credentials - use environment variables or prompt
  const nom = process.env.ADMIN_NOM || await prompt("Enter admin last name (nom): ")
  const prenom = process.env.ADMIN_PRENOM || await prompt("Enter admin first name (prenom): ")

  // Get password securely - environment variable or prompt
  let password = process.env.ADMIN_PASSWORD
  if (!password) {
    console.log("\n⚠️  For security, set ADMIN_PASSWORD environment variable")
    console.log("   Example: ADMIN_PASSWORD=YourSecurePass123 npm run admin:create\n")
    password = await prompt("Enter admin password (min 8 chars, require uppercase + number): ")

    // Basic password validation
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      console.error("❌ Password must be at least 8 characters with uppercase and number")
      await connection.end()
      process.exit(1)
    }
  }

  const role = process.env.ADMIN_ROLE || "ceo"

  // Hash the password
  const password_hash = await bcrypt.hash(password, 10)

  // Insert admin
  const [result] = await connection.execute(
    "INSERT INTO admins (nom, prenom, password_hash, role) VALUES (?, ?, ?, ?)",
    [nom, prenom, password_hash, role],
  )

  console.log("✓ Admin created successfully!")
  console.log("\n=== Admin Login Credentials ===")
  console.log("Nom:", nom)
  console.log("Prenom:", prenom)
  console.log("Password:", "********") // Don't log actual password
  console.log("Role:", role)
  console.log("===============================\n")

  await connection.end()
}

createAdmin().catch(console.error)

