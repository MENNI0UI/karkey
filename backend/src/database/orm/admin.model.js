// ============================================
// نموذج المسؤول (Admin Model)
// ============================================

const db = require("../index")
const bcrypt = require("bcryptjs")

class Admin {
  // إنشاء مسؤول جديد
  static async create(adminData) {
    const { nom, prenom, password, role } = adminData

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 10)

    const sql = `
      INSERT INTO admins (nom, prenom, password_hash, role)
      VALUES (?, ?, ?, ?)
    `

    const result = await db.query(sql, [nom, prenom, hashedPassword, role])

    return result.insertId
  }

  // البحث عن مسؤول بالبريد الإلكتروني
  static async findByEmail(email) {
    const sql = "SELECT * FROM admins WHERE email = ?"
    return await db.queryOne(sql, [email])
  }

  // البحث عن مسؤول بالمعرف
  static async findById(id) {
    const sql = "SELECT * FROM admins WHERE id = ?"
    return await db.queryOne(sql, [id])
  }

  // التحقق من كلمة المرور
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword)
  }

  // البحث عن مسؤول باستخدام الاسم واللقب
  static async findByNomPrenom(nom, prenom) {
    const sql = "SELECT * FROM admins WHERE nom = ? AND prenom = ?"
    return await db.queryOne(sql, [nom, prenom])
  }

  // الحصول على جميع المسؤولين
  static async findAll(filters = {}) {
    let sql = "SELECT id, nom, prenom, role, created_at FROM admins WHERE 1=1"
    const params = []

    if (filters.role) {
      sql += " AND role = ?"
      params.push(filters.role)
    }

    return await db.query(sql, params)
  }

  // تحديث معلومات المسؤول
  static async update(adminId, updateData) {
    const { nom, prenom, role } = updateData

    const sql = `
      UPDATE admins 
      SET nom = ?, prenom = ?, role = ?
      WHERE id = ?
    `
    await db.query(sql, [nom, prenom, role, adminId])
  }

  // حذف مسؤول
  static async delete(adminId) {
    const sql = "DELETE FROM admins WHERE id = ?"
    await db.query(sql, [adminId])
  }
}

module.exports = Admin
