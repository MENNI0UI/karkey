require("dotenv").config()
const mysql = require("mysql2/promise")

async function createAuctionTables() {
  let connection

  try {
    console.log("🔧 إنشاء جداول المزادات...")

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || "localhost",
      port: Number.parseInt(process.env.DB_PORT || "3306"),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: "karkey",
    })

    console.log("✅ تم الاتصال بقاعدة البيانات karkey")

    // جدول المركبات
    console.log("📝 إنشاء جدول vehicles...")
    await connection.query(`
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
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT chk_year CHECK (year >= 1900 AND year <= 2030),
        CONSTRAINT chk_mileage CHECK (mileage >= 0)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    console.log("✅ تم إنشاء جدول vehicles")

    // جدول صور المركبات
    console.log("📝 إنشاء جدول vehicle_photos...")
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vehicle_photos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vehicle_id INT NOT NULL,
        photo_url VARCHAR(500) NOT NULL,
        position_order INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
        CONSTRAINT chk_position CHECK (position_order >= 0)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    console.log("✅ تم إنشاء جدول vehicle_photos")

    // جدول المزادات
    console.log("📝 إنشاء جدول auctions...")
    await connection.query(`
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
        
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (winner_id) REFERENCES users(id) ON DELETE SET NULL,
        CONSTRAINT chk_starting_price CHECK (starting_price > 0),
        CONSTRAINT chk_reserve_price CHECK (reserve_price IS NULL OR reserve_price >= starting_price),
        CONSTRAINT chk_current_bid CHECK (current_bid IS NULL OR current_bid >= starting_price),
        CONSTRAINT chk_duration CHECK (duration_days > 0 AND duration_days <= 30),
        CONSTRAINT chk_dates CHECK (end_date > start_date),
        UNIQUE KEY unique_vehicle_auction (vehicle_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)
    console.log("✅ تم إنشاء جدول auctions")

    // إنشاء Indexes
    console.log("📝 إنشاء Indexes...")

    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_vehicles_user_id ON vehicles(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_vehicles_verification_status ON vehicles(verification_status)",
      "CREATE INDEX IF NOT EXISTS idx_vehicles_make_model ON vehicles(make, model)",
      "CREATE INDEX IF NOT EXISTS idx_vehicle_photos_vehicle_id ON vehicle_photos(vehicle_id)",
      "CREATE INDEX IF NOT EXISTS idx_vehicle_photos_position ON vehicle_photos(position_order)",
      "CREATE INDEX IF NOT EXISTS idx_auctions_vehicle_id ON auctions(vehicle_id)",
      "CREATE INDEX IF NOT EXISTS idx_auctions_user_id ON auctions(user_id)",
      "CREATE INDEX IF NOT EXISTS idx_auctions_status ON auctions(status)",
      "CREATE INDEX IF NOT EXISTS idx_auctions_start_date ON auctions(start_date)",
      "CREATE INDEX IF NOT EXISTS idx_auctions_end_date ON auctions(end_date)",
    ]

    for (const indexQuery of indexes) {
      try {
        await connection.query(indexQuery)
      } catch (error) {
        if (error.code === "ER_DUP_KEYNAME") {
          console.log("⚠️  Index موجود مسبقاً - تم التجاوز")
        } else {
          throw error
        }
      }
    }

    console.log("✅ تم إنشاء Indexes")

    console.log("🎉 تم إنشاء جميع جداول المزادات بنجاح!")
  } catch (error) {
    console.error("❌ خطأ في إنشاء الجداول:", error.message)
    console.error("التفاصيل:", error)
    process.exit(1)
  } finally {
    if (connection) {
      await connection.end()
    }
  }
}

createAuctionTables()
