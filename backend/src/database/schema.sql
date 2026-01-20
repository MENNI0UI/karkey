-- ============================================
-- قاعدة بيانات Karkey
-- ============================================
-- هذا الملف يحتوي على جميع الجداول
-- لإضافة أو تعديل أو حذف جداول، عدل هذا الملف فقط
-- ============================================

-- إنشاء قاعدة البيانات إذا لم تكن موجودة
CREATE DATABASE IF NOT EXISTS karkey CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE karkey;

-- ============================================
-- جدول المستخدمين (USERS)
-- ============================================
-- Removed prenom, nom, cin, birthday_date, is_admin fields
-- Renamed password to password_hash
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(20) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20) NOT NULL,
  user_type ENUM('individual', 'dealer', 'company') NOT NULL,
  verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- التحقق من صحة البيانات
  CONSTRAINT chk_username CHECK (username REGEXP '^[a-zA-Z0-9_]{3,20}$'),
  CONSTRAINT chk_email CHECK (email REGEXP '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$'),
  CONSTRAINT chk_phone CHECK (phone_number REGEXP '^\\+[1-9][0-9]{6,14}$')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- جدول التحقق من الهوية (VERIFICATIONS)
-- ============================================
-- Added reviewed_by field to track which admin reviewed
CREATE TABLE IF NOT EXISTS verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  cin_number VARCHAR(12) NOT NULL UNIQUE,
  cin_front VARCHAR(500) NOT NULL,
  cin_back VARCHAR(500) NOT NULL,
  selfie_with_cin VARCHAR(500) NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  rejected_reason TEXT NULL,
  reviewed_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  reviewed_at TIMESTAMP NULL,
  
  -- التحقق من صحة البيانات
  CONSTRAINT chk_cin CHECK (cin_number REGEXP '^[A-Z]{1,4}[0-9]{1,8}$'),
  
  -- ربط مع جدول المستخدمين
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- كل مستخدم له verification واحد فقط
  UNIQUE KEY unique_user_verification (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- جدول المسؤولين (ADMINS)
-- ============================================
-- Removed email field from admins table
CREATE TABLE IF NOT EXISTS admins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(50) NOT NULL,
  prenom VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('ceo', 'verification', 'finance', 'support') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- جدول الإشعارات (NOTIFICATIONS)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('success', 'error', 'info', 'warning') DEFAULT 'info',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_id (user_id),
  INDEX idx_notifications_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- جدول المركبات (VEHICLES)
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  year INT NOT NULL,
  mileage INT NOT NULL,
  transmission ENUM('manual', 'automatic') NOT NULL,
  fuel_type ENUM('gasoline', 'diesel', 'electric', 'hybrid') NOT NULL,
  vehicle_condition ENUM('excellent', 'good', 'fair', 'poor') NOT NULL,
  location VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  carte_grise_url VARCHAR(500) NOT NULL,
  service_history_url VARCHAR(500) NULL,
  verification_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  rejected_reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- ربط مع جدول المستخدمين
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- التحقق من صحة البيانات
  CONSTRAINT chk_year CHECK (year >= 1900 AND year <= 2030),
  CONSTRAINT chk_mileage CHECK (mileage >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- جدول صور المركبات (VEHICLE_PHOTOS)
-- ============================================
CREATE TABLE IF NOT EXISTS vehicle_photos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  photo_url VARCHAR(500) NOT NULL,
  position_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- ربط مع جدول المركبات
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  
  -- التحقق من صحة البيانات
  CONSTRAINT chk_position CHECK (position_order >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- جدول المزادات (AUCTIONS)
-- ============================================
CREATE TABLE IF NOT EXISTS auctions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  user_id INT NOT NULL,
  starting_price DECIMAL(10, 2) NOT NULL,
  reserve_price DECIMAL(10, 2) NULL,
  current_bid DECIMAL(10, 2) NULL,
  duration_days INT NOT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  status ENUM('pending', 'active', 'completed', 'cancelled') DEFAULT 'pending',
  deposit_paid BOOLEAN DEFAULT FALSE,
  deposit_amount DECIMAL(10, 2) DEFAULT 2000.00,
  winner_id INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- ربط مع جدول المركبات والمستخدمين
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL,
  
  -- التحقق من صحة البيانات
  CONSTRAINT chk_starting_price CHECK (starting_price > 0),
  CONSTRAINT chk_reserve_price CHECK (reserve_price IS NULL OR reserve_price >= starting_price),
  CONSTRAINT chk_current_bid CHECK (current_bid IS NULL OR current_bid >= starting_price),
  CONSTRAINT chk_duration CHECK (duration_days > 0 AND duration_days <= 30),
  CONSTRAINT chk_dates CHECK (end_date > start_date),
  
  -- كل مركبة لها مزاد واحد فقط
  UNIQUE KEY unique_vehicle_auction (vehicle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- إنشاء Indexes لتحسين الأداء
-- ============================================
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_verification_status ON users(verification_status);
CREATE INDEX idx_verifications_user_id ON verifications(user_id);
CREATE INDEX idx_verifications_status ON verifications(status);
CREATE INDEX idx_verifications_cin ON verifications(cin_number);
-- Removed email index from admins
CREATE INDEX idx_admins_role ON admins(role);

-- ============================================
-- إنشاء Indexes إضافية للجداول الجديدة
-- ============================================
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_verification_status ON vehicles(verification_status);
CREATE INDEX idx_vehicles_make_model ON vehicles(make, model);
CREATE INDEX idx_vehicle_photos_vehicle_id ON vehicle_photos(vehicle_id);
CREATE INDEX idx_vehicle_photos_position ON vehicle_photos(position_order);
CREATE INDEX idx_auctions_vehicle_id ON auctions(vehicle_id);
CREATE INDEX idx_auctions_user_id ON auctions(user_id);
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_auctions_start_date ON auctions(start_date);
CREATE INDEX idx_auctions_end_date ON auctions(end_date);

-- ============================================
-- الجداول الإضافية حسب ERD: bids, plans, subscriptions, deposits, invoices, payments, inspections, requests, blacklists
-- ============================================

-- BIDS
CREATE TABLE IF NOT EXISTS bids (
  id INT AUTO_INCREMENT PRIMARY KEY,
  auction_id INT NOT NULL,
  user_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PLANS
CREATE TABLE IF NOT EXISTS plans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'MAD',
  duration_days INT NOT NULL,
  bid_limit INT NULL,
  status ENUM('active','inactive') NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  plan_id INT NOT NULL,
  status ENUM('pending','active','expired','cancelled') NOT NULL DEFAULT 'pending',
  start_date DATETIME NULL,
  end_date DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- DEPOSITS
CREATE TABLE IF NOT EXISTS deposits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  auction_id INT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status ENUM('pending','paid','refunded','failed') NOT NULL DEFAULT 'pending',
  method ENUM('card','bank','cash','other') NOT NULL DEFAULT 'card',
  reference VARCHAR(191) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (auction_id) REFERENCES auctions(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- INVOICES
CREATE TABLE IF NOT EXISTS invoices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  subscription_id INT NULL,
  deposit_id INT NULL,
  total DECIMAL(12,2) NOT NULL,
  status ENUM('draft','issued','paid','void','refunded') NOT NULL DEFAULT 'issued',
  issued_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  due_at DATETIME NULL,
  paid_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
  FOREIGN KEY (deposit_id) REFERENCES deposits(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  invoice_id INT NULL,
  amount DECIMAL(12,2) NOT NULL,
  status ENUM('pending','succeeded','failed','refunded') NOT NULL DEFAULT 'pending',
  provider ENUM('stripe','paypal','transfer','cash','other') NOT NULL DEFAULT 'other',
  provider_ref VARCHAR(191) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- INSPECTIONS
CREATE TABLE IF NOT EXISTS inspections (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  requested_by INT NOT NULL,
  scheduled_at DATETIME NULL,
  status ENUM('pending','scheduled','completed','cancelled') NOT NULL DEFAULT 'pending',
  report_url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- REQUESTS
CREATE TABLE IF NOT EXISTS requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type ENUM('verification','auction','withdrawal','support','other') NOT NULL DEFAULT 'other',
  status ENUM('pending','approved','rejected','cancelled','in_progress') NOT NULL DEFAULT 'pending',
  payload JSON NULL,
  admin_notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- BLACKLISTS
CREATE TABLE IF NOT EXISTS blacklists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  admin_id INT NULL,
  reason TEXT NULL,
  expires_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for new tables
CREATE INDEX idx_bids_auction_id_created_at ON bids(auction_id, created_at);
CREATE INDEX idx_bids_user_id ON bids(user_id);
CREATE INDEX idx_plans_status ON plans(status);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_deposits_user_id ON deposits(user_id);
CREATE INDEX idx_deposits_status ON deposits(status);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_payments_user_id ON payments(user_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_inspections_vehicle_id ON inspections(vehicle_id);
CREATE INDEX idx_inspections_status ON inspections(status);
CREATE INDEX idx_requests_user_id ON requests(user_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE UNIQUE INDEX IF NOT EXISTS unique_blacklist_user ON blacklists(user_id);
