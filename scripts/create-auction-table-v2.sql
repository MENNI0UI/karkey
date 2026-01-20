-- ============================================
-- Updated Auction Table with Full 5-Step Flow Support
-- ============================================
DROP TABLE IF EXISTS vehicle_auction;

CREATE TABLE vehicle_auction (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  
  -- Step 1: Car Details
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  mileage INT NOT NULL,
  vehicle_condition ENUM('new', 'used') NOT NULL DEFAULT 'used',
  fuel_type ENUM('petrol', 'diesel', 'hybrid', 'electric') NOT NULL,
  transmission ENUM('manual', 'automatic') NOT NULL,
  color VARCHAR(50) NOT NULL,
  location VARCHAR(100) NOT NULL,
  description TEXT,
  
  -- Step 2: Photos (minimum 5 required)
  photo_1 VARCHAR(500),
  photo_2 VARCHAR(500),
  photo_3 VARCHAR(500),
  photo_4 VARCHAR(500),
  photo_5 VARCHAR(500),
  photo_6 VARCHAR(500),
  photo_7 VARCHAR(500),
  photo_8 VARCHAR(500),
  photo_9 VARCHAR(500),
  photo_10 VARCHAR(500),
  
  -- Step 3: Documents
  carte_grise VARCHAR(500),
  cin_verification VARCHAR(500),
  service_history VARCHAR(500),
  purchase_invoice VARCHAR(500),
  technical_inspection VARCHAR(500),
  document_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  
  -- Step 4: Pricing
  starting_price DECIMAL(12, 2) NOT NULL,
  reserve_price DECIMAL(12, 2),
  auction_duration INT NOT NULL DEFAULT 14,
  start_date DATETIME,
  auction_end_date DATETIME,
  seller_deposit_paid BOOLEAN DEFAULT FALSE,
  seller_deposit_amount DECIMAL(12, 2) DEFAULT 2000.00,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Auction Status
  status ENUM('draft', 'pending_verification', 'under_verification', 'live', 'sold', 'expired', 'cancelled', 'rejected') DEFAULT 'draft',
  rejection_reason TEXT,
  
  -- Step 5: Legal Declarations
  legal_declaration_accepted BOOLEAN DEFAULT FALSE,
  terms_accepted BOOLEAN DEFAULT FALSE,
  
  -- Current Auction Data
  current_price DECIMAL(12, 2),
  total_bids INT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  published_at TIMESTAMP NULL,
  verified_at TIMESTAMP NULL,
  verified_by INT NULL,
  
  -- Foreign Keys
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (verified_by) REFERENCES users(id) ON DELETE SET NULL,
  
  -- Constraints
  CONSTRAINT chk_year CHECK (year >= 1900 AND year <= YEAR(CURDATE()) + 1),
  CONSTRAINT chk_mileage CHECK (mileage >= 0),
  CONSTRAINT chk_starting_price CHECK (starting_price > 0),
  CONSTRAINT chk_auction_duration CHECK (auction_duration BETWEEN 7 AND 30)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for performance
CREATE INDEX idx_auction_user_id ON vehicle_auction(user_id);
CREATE INDEX idx_auction_status ON vehicle_auction(status);
CREATE INDEX idx_auction_end_date ON vehicle_auction(auction_end_date);
CREATE INDEX idx_auction_make_model ON vehicle_auction(make, model);
CREATE INDEX idx_auction_location ON vehicle_auction(location);
