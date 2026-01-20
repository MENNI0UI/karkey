-- Create vehicle_auction table for Karkey auction platform
CREATE TABLE IF NOT EXISTS vehicle_auction (
  id INT AUTO_INCREMENT PRIMARY KEY,
  seller_id INT NOT NULL,
  
  -- Car Details
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  mileage INT NOT NULL,
  condition_status ENUM('excellent', 'good', 'fair', 'poor') NOT NULL,
  fuel_type ENUM('petrol', 'diesel', 'electric', 'hybrid') NOT NULL,
  transmission ENUM('automatic', 'manual') NOT NULL,
  location VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- Photos (stored as JSON array of URLs)
  photos JSON NOT NULL,
  
  -- Documents (stored as JSON object with document URLs)
  carte_grise_url VARCHAR(500) NOT NULL,
  service_history_url VARCHAR(500),
  
  -- Pricing
  starting_price DECIMAL(10, 2) NOT NULL,
  reserve_price DECIMAL(10, 2),
  current_bid DECIMAL(10, 2) DEFAULT 0,
  
  -- Auction Details
  auction_duration INT NOT NULL, -- in days
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  
  -- Deposit
  deposit_paid BOOLEAN DEFAULT FALSE,
  deposit_amount DECIMAL(10, 2) DEFAULT 2000.00,
  
  -- Status
  status ENUM('pending', 'active', 'completed', 'cancelled') DEFAULT 'pending',
  admin_approved BOOLEAN DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (seller_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_seller (seller_id),
  INDEX idx_status (status),
  INDEX idx_end_date (end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
