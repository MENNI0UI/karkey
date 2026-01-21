-- Create vehicle_photos table to store multiple photos for each vehicle
CREATE TABLE IF NOT EXISTS vehicle_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  photo_url VARCHAR(500) NOT NULL COMMENT 'Photo URL',
  position_order INT NOT NULL DEFAULT 0 COMMENT 'Photo display order',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  INDEX idx_vehicle_id (vehicle_id),
  INDEX idx_position_order (position_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
