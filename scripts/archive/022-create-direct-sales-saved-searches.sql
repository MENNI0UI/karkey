-- Add table for direct sales saved searches (for authenticated users)
CREATE TABLE IF NOT EXISTS direct_sales_saved_searches (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  params JSON NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_notified_at DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_user_id (user_id)
);
