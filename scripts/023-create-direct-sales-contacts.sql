-- Table to store Contact Us requests for direct sales
CREATE TABLE IF NOT EXISTS direct_sales_contacts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  direct_sale_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED DEFAULT NULL,
  name VARCHAR(255) DEFAULT NULL,
  email VARCHAR(255) DEFAULT NULL,
  phone VARCHAR(100) DEFAULT NULL,
  message TEXT DEFAULT NULL,
  processed TINYINT(1) NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  INDEX idx_direct_sale_id (direct_sale_id),
  INDEX idx_user_id (user_id)
);
