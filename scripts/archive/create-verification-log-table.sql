-- Verification Decision Log Table
-- Stores history of all verification decisions (users and vehicles)

CREATE TABLE IF NOT EXISTS verification_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entity_type ENUM('user', 'vehicle') NOT NULL,
  entity_id INT NOT NULL,
  action ENUM('approved', 'rejected') NOT NULL,
  reason VARCHAR(500) NULL,
  admin_id INT NOT NULL,
  admin_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  INDEX idx_verification_log_entity (entity_type, entity_id),
  INDEX idx_verification_log_admin (admin_id),
  INDEX idx_verification_log_action (action),
  INDEX idx_verification_log_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
