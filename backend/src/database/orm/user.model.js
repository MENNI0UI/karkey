// ============================================
// نموذج المستخدم (User Model)
// ============================================

const db = require("../index")
const bcrypt = require("bcryptjs")

class User {
  // إنشاء مستخدم جديد
  static async create(userData) {
    const { username, email, password, first_name, last_name, phone_number, user_type, birthday } = userData

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10)

    const sql = `
      INSERT INTO users (username, email, password_hash, first_name, last_name, birthday, phone_number, user_type)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `

    const result = await db.query(sql, [username, email, hashedPassword, first_name, last_name, birthday, phone_number, user_type])

    return result.insertId
  }

  // البحث عن مستخدم بالبريد الإلكتروني
  static async findByEmail(email) {
    const sql = "SELECT * FROM users WHERE email = ?"
    return await db.queryOne(sql, [email])
  }

  // البحث عن مستخدم باسم المستخدم
  static async findByUsername(username) {
    const sql = "SELECT * FROM users WHERE username = ?"
    return await db.queryOne(sql, [username])
  }

  // البحث عن مستخدم بالمعرف
  static async findById(id) {
    const sql = "SELECT * FROM users WHERE id = ?"
    return await db.queryOne(sql, [id])
  }

  // التحقق من كلمة المرور
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword)
  }

  // تحديث حالة التحقق
  static async updateVerificationStatus(userId, status) {
    const sql = "UPDATE users SET verification_status = ? WHERE id = ?"
    await db.query(sql, [status, userId])
  }

  // الحصول على جميع المستخدمين
  static async findAll(filters = {}) {
    let sql = "SELECT * FROM users WHERE 1=1"
    const params = []

    if (filters.user_type) {
      sql += " AND user_type = ?"
      params.push(filters.user_type)
    }

    if (filters.verification_status) {
      sql += " AND verification_status = ?"
      params.push(filters.verification_status)
    }

    return await db.query(sql, params)
  }

  // حذف مستخدم
  static async delete(userId) {
    const sql = "DELETE FROM users WHERE id = ?"
    await db.query(sql, [userId])
  }
}

module.exports = User
