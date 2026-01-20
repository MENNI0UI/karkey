-- Create saved_searches table to store user saved searches
CREATE TABLE IF NOT EXISTS saved_searches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL COMMENT 'Owner user id',
  name VARCHAR(200) NOT NULL COMMENT 'User-provided name for the saved search',
  params JSON NOT NULL COMMENT 'Search params as JSON',
  is_active TINYINT(1) DEFAULT 1,
  last_notified_at DATETIME NULL COMMENT 'Last time notifications were checked for this saved search',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_is_active (is_active),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
