-- ============================================
-- جدول المزادات (AUCTIONS)
-- ============================================
CREATE TABLE IF NOT EXISTS vehicle_auction (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  
  -- معلومات السيارة
  brand VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  mileage INT NOT NULL,
  fuel_type ENUM('petrol', 'diesel', 'electric', 'hybrid') NOT NULL,
  transmission ENUM('automatic', 'manual') NOT NULL,
  color VARCHAR(50) NOT NULL,
  
  -- معلومات المزاد
  starting_price DECIMAL(12, 2) NOT NULL,
  current_price DECIMAL(12, 2) NOT NULL,
  reserve_price DECIMAL(12, 2) NULL,
  auction_end_date DATETIME NOT NULL,
  
  -- الموقع والوصف
  location VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  
  -- الصور
  main_image VARCHAR(500) NOT NULL,
  image_2 VARCHAR(500) NULL,
  image_3 VARCHAR(500) NULL,
  image_4 VARCHAR(500) NULL,
  image_5 VARCHAR(500) NULL,
  
  -- الحالة
  status ENUM('pending', 'active', 'sold', 'expired', 'cancelled') DEFAULT 'pending',
  
  -- التواريخ
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- ربط مع جدول المستخدمين
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- التحقق من صحة البيانات
  CONSTRAINT chk_year CHECK (year >= 1900 AND year <= YEAR(CURDATE()) + 1),
  CONSTRAINT chk_mileage CHECK (mileage >= 0),
  CONSTRAINT chk_starting_price CHECK (starting_price > 0),
  CONSTRAINT chk_current_price CHECK (current_price >= starting_price),
  CONSTRAINT chk_auction_end_date CHECK (auction_end_date > NOW())
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- إنشاء Indexes لتحسين الأداء
CREATE INDEX idx_auction_user_id ON vehicle_auction(user_id);
CREATE INDEX idx_auction_status ON vehicle_auction(status);
CREATE INDEX idx_auction_end_date ON vehicle_auction(auction_end_date);
CREATE INDEX idx_auction_brand_model ON vehicle_auction(brand, model);
