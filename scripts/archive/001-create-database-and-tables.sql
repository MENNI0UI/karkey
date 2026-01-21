-- إنشاء قاعدة البيانات karkey
CREATE DATABASE IF NOT EXISTS karkey
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

-- ===================================
-- جدول المستخدمين (USERS)
-- ===================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  user_type ENUM('individual', 'dealer', 'company') NOT NULL,
  verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes للبحث السريع
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_verification_status (verification_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================================
-- جدول التحقق من الهوية (VERIFICATIONS)
-- ===================================
CREATE TABLE IF NOT EXISTS verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  cin_number VARCHAR(12) NOT NULL UNIQUE,
  cin_front VARCHAR(500) NOT NULL,
  cin_back VARCHAR(500) NOT NULL,
  selfie_with_cin VARCHAR(500) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  rejected_reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Key للربط مع جدول المستخدمين
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Indexes للبحث السريع
  INDEX idx_user_id (user_id),
  INDEX idx_cin_number (cin_number),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
