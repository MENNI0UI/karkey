-- ============================================
-- جدول البيع المباشر (DIRECT_SALES)
-- ============================================
-- جدول مخصص للسيارات المعروضة للبيع المباشر (بدون مزاد)

USE karkey;

CREATE TABLE IF NOT EXISTS direct_sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  
  -- معلومات السيارة
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  mileage INT NOT NULL,
  transmission ENUM('manual', 'automatic') NOT NULL,
  fuel_type ENUM('gasoline', 'diesel', 'electric', 'hybrid') NOT NULL,
  engine_size VARCHAR(20) NULL,
  doors VARCHAR(10) NULL,
  vehicle_condition ENUM('excellent', 'good', 'fair', 'poor') NOT NULL,
  location VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  
  -- السعر
  price DECIMAL(12, 2) NOT NULL,
  
  -- المستندات
  carte_grise_url VARCHAR(500) NULL,
  service_history_url VARCHAR(500) NULL,
  
  -- حالة التحقق
  verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  rejected_reason TEXT NULL,
  reviewed_by INT NULL,
  reviewed_at TIMESTAMP NULL,
  
  -- حالة البيع
  sale_status ENUM('available', 'sold', 'reserved', 'cancelled') DEFAULT 'available',
  buyer_id INT NULL,
  sold_at TIMESTAMP NULL,
  
  -- الطوابع الزمنية
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- الروابط الخارجية
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES admins(id) ON DELETE SET NULL,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE SET NULL,
  
  -- التحقق من صحة البيانات
  CONSTRAINT chk_ds_year CHECK (year >= 1900 AND year <= 2030),
  CONSTRAINT chk_ds_mileage CHECK (mileage >= 0),
  CONSTRAINT chk_ds_price CHECK (price >= 10000)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- جدول صور البيع المباشر (DIRECT_SALE_PHOTOS)
-- ============================================
CREATE TABLE IF NOT EXISTS direct_sale_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  direct_sale_id INT NOT NULL,
  photo_url VARCHAR(500) NOT NULL,
  position_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (direct_sale_id) REFERENCES direct_sales(id) ON DELETE CASCADE,
  CONSTRAINT chk_dsp_position CHECK (position_order >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- إنشاء Indexes لتحسين الأداء
-- ============================================
CREATE INDEX idx_direct_sales_user_id ON direct_sales(user_id);
CREATE INDEX idx_direct_sales_verification_status ON direct_sales(verification_status);
CREATE INDEX idx_direct_sales_sale_status ON direct_sales(sale_status);
CREATE INDEX idx_direct_sales_make_model ON direct_sales(make, model);
CREATE INDEX idx_direct_sales_price ON direct_sales(price);
CREATE INDEX idx_direct_sales_year ON direct_sales(year);
CREATE INDEX idx_direct_sales_location ON direct_sales(location);
CREATE INDEX idx_direct_sale_photos_direct_sale_id ON direct_sale_photos(direct_sale_id);
CREATE INDEX idx_direct_sale_photos_position ON direct_sale_photos(position_order);
