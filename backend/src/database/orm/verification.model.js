// ============================================
// نموذج التحقق (Verification Model)
// ============================================

const db = require("../index")

class Verification {
  // إنشاء طلب تحقق جديد
  static async create(verificationData) {
    const { user_id, cin_number, cin_front, cin_back, selfie_with_cin } = verificationData

    const sql = `
      INSERT INTO verifications 
      (user_id, cin_number, cin_front, cin_back, selfie_with_cin)
      VALUES (?, ?, ?, ?, ?)
    `

    const result = await db.query(sql, [user_id, cin_number, cin_front, cin_back, selfie_with_cin])

    return result.insertId
  }

  // البحث عن تحقق بواسطة معرف المستخدم
  static async findByUserId(userId) {
    const sql = "SELECT * FROM verifications WHERE user_id = ?"
    return await db.queryOne(sql, [userId])
  }

  // البحث عن تحقق بواسطة رقم البطاقة
  static async findByCinNumber(cinNumber) {
    const sql = "SELECT * FROM verifications WHERE cin_number = ?"
    return await db.queryOne(sql, [cinNumber])
  }

  // الحصول على جميع طلبات التحقق
  static async findAll(filters = {}) {
    let sql = "SELECT * FROM verifications WHERE 1=1"
    const params = []

    if (filters.status) {
      sql += " AND status = ?"
      params.push(filters.status)
    }

    sql += " ORDER BY created_at DESC"

    return await db.query(sql, params)
  }

  // تحديث حالة التحقق
  static async updateStatus(verificationId, status, reviewedBy, rejectedReason = null) {
    const sql = `
      UPDATE verifications 
      SET status = ?, reviewed_by = ?, rejected_reason = ?, reviewed_at = NOW()
      WHERE id = ?
    `
    await db.query(sql, [status, reviewedBy, rejectedReason, verificationId])
  }

  // الحصول على طلبات التحقق المعلقة
  static async getPending() {
    const sql = `
      SELECT v.*, u.username, u.email 
      FROM verifications v
      JOIN users u ON v.user_id = u.id
      WHERE v.status = 'pending'
      ORDER BY v.created_at ASC
    `
    return await db.query(sql)
  }

  // حذف تحقق
  static async delete(verificationId) {
    const sql = "DELETE FROM verifications WHERE id = ?"
    await db.query(sql, [verificationId])
  }
}

module.exports = Verification
