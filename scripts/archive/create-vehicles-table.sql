-- Create vehicles table to store vehicle information for auctions
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  make VARCHAR(100) NOT NULL COMMENT 'Brand (e.g., Toyota)',
  model VARCHAR(100) NOT NULL COMMENT 'Model',
  year INT NOT NULL,
  mileage INT NOT NULL COMMENT 'Mileage in kilometers',
  transmission ENUM('manual', 'automatic') NOT NULL COMMENT 'Transmission type',
  fuel_type ENUM('petrol', 'diesel', 'electric', 'hybrid') NOT NULL COMMENT 'Fuel type',
  `condition` ENUM('used', 'new', 'needs_repair') NOT NULL COMMENT 'Vehicle condition',
  price_start DECIMAL(10, 2) NOT NULL COMMENT 'Starting price in MAD',
  reserve_price DECIMAL(10, 2) NULL COMMENT 'Minimum acceptable price (optional)',
  duration_days INT NOT NULL COMMENT 'Auction duration (7-30 days)',
  description TEXT NOT NULL COMMENT 'General description',
  carte_grise_url VARCHAR(500) NULL COMMENT 'Carte Grise (gray card) image URL',
  verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending' COMMENT 'Verification status',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_verification_status (verification_status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
