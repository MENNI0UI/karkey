-- Create auctions table to manage auction lifecycle for vehicles
CREATE TABLE IF NOT EXISTS auctions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  start_date DATETIME NOT NULL COMMENT 'Auction start date and time',
  end_date DATETIME NOT NULL COMMENT 'Auction end date and time',
  status ENUM('scheduled', 'active', 'ended', 'cancelled') DEFAULT 'scheduled' COMMENT 'Auction status',
  winning_bid_id INT NULL COMMENT 'ID of winning bid (set after auction ends)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  INDEX idx_vehicle_id (vehicle_id),
  INDEX idx_status (status),
  INDEX idx_start_date (start_date),
  INDEX idx_end_date (end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
