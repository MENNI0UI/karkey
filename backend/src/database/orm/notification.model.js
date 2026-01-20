const db = require("../index")

const NotificationModel = {
  // Create a new notification
  async create(userId, title, message, type = "info") {
    const query = `
      INSERT INTO notifications (user_id, title, message, type)
      VALUES (?, ?, ?, ?)
    `
    const [result] = await db.query(query, [userId, title, message, type])
    return result.insertId
  },

  // Get all notifications for a user
  async getByUserId(userId) {
    const query = `
      SELECT id, user_id, title, message, type, is_read, created_at
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
    `
    const result = await db.query(query, [userId])
    console.log("[NOTIFICATION MODEL] getByUserId raw result:", result)
    console.log("[NOTIFICATION MODEL] result is array?:", Array.isArray(result))
    console.log("[NOTIFICATION MODEL] result length:", result?.length)
    // Return the array directly (query already destructures it)
    return Array.isArray(result) ? result : []
  },

  // Get unread notifications for a user
  async getUnreadByUserId(userId) {
    const query = `
      SELECT * FROM notifications
      WHERE user_id = ? AND is_read = FALSE
      ORDER BY created_at DESC
    `
    const [rows] = await db.query(query, [userId])
    return rows
  },

  // Mark notification as read
  async markAsRead(notificationId) {
    const query = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE id = ?
    `
    await db.query(query, [notificationId])
  },

  // Mark all notifications as read for a user
  async markAllAsRead(userId) {
    const query = `
      UPDATE notifications
      SET is_read = TRUE
      WHERE user_id = ?
    `
    await db.query(query, [userId])
  },

  // Delete a notification
  async delete(notificationId) {
    const query = `DELETE FROM notifications WHERE id = ?`
    await db.query(query, [notificationId])
  },
}

module.exports = NotificationModel
