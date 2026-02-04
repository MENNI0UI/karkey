-- ═══════════════════════════════════════════════════════════════════════════════
-- 📦 MySQL Events for Karkey Auction Automation
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- 🎯 نظام المزادات البسيط:
-- السيارات تبقى في جدول direct_sales مع حقول المزاد (auction_mode, auction_status, etc.)
--
-- 📅 الجدول الزمني:
-- 1. الجمعة 23:55 - تحضير السيارات للمزاد (التي مر عليها 10 أيام ولم تُباع)
-- 2. السبت 00:00 - تفعيل جميع المزادات المحضرة
-- 3. الأحد 23:59 - إنهاء جميع المزادات (تحديد الفائزين أو إرجاع للبيع المباشر)
-- 4. كل دقيقة - فحص المزادات المنتهية وإنهائها تلقائياً
--
-- ═══════════════════════════════════════════════════════════════════════════════

-- أولاً: تأكد من تفعيل event_scheduler في MySQL
SET GLOBAL event_scheduler = ON;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1️⃣ EVENT: تحضير المزادات (الجمعة 23:55)
-- ═══════════════════════════════════════════════════════════════════════════════
DELIMITER //

DROP EVENT IF EXISTS auto_prepare_auctions//

CREATE EVENT auto_prepare_auctions
ON SCHEDULE EVERY 1 WEEK
STARTS (
    -- أقرب جمعة الساعة 23:55
    TIMESTAMPADD(
        HOUR, 23,
        TIMESTAMPADD(
            MINUTE, 55,
            DATE_ADD(
                CURDATE(),
                INTERVAL (6 - WEEKDAY(CURDATE()) + 7) % 7 - 1 DAY
            )
        )
    )
)
ON COMPLETION PRESERVE
ENABLE
COMMENT 'تحضير السيارات المؤهلة للمزاد كل جمعة 23:55'
DO
BEGIN
    DECLARE v_saturday_start DATETIME;
    DECLARE v_sunday_end DATETIME;
    DECLARE v_ten_days_ago DATETIME;
    DECLARE v_count INT DEFAULT 0;
    
    -- حساب تواريخ نهاية الأسبوع
    SET v_saturday_start = DATE_ADD(CURDATE(), INTERVAL (5 - WEEKDAY(CURDATE()) + 7) % 7 + 1 DAY);
    SET v_saturday_start = TIMESTAMP(v_saturday_start, '00:00:00');
    SET v_sunday_end = TIMESTAMP(DATE_ADD(v_saturday_start, INTERVAL 1 DAY), '23:59:59');
    SET v_ten_days_ago = DATE_SUB(NOW(), INTERVAL 10 DAY);
    
    -- تحديث السيارات المؤهلة
    UPDATE direct_sales
    SET 
        auction_mode = 1,
        auction_status = 'pending',
        auction_start_date = v_saturday_start,
        auction_end_date = v_sunday_end,
        auction_current_bid = NULL,
        auction_winner_id = NULL,
        auction_bid_count = 0,
        updated_at = NOW()
    WHERE 
        verification_status = 'approved'
        AND sale_status = 'available'
        AND auction_consent = 1
        AND auction_starting_price IS NOT NULL
        AND auction_reserve_price IS NOT NULL
        AND (auction_mode IS NULL OR auction_mode = 0)
        AND created_at < v_ten_days_ago;
    
    SET v_count = ROW_COUNT();
    
    -- تسجيل العملية
    INSERT INTO system_logs (action, details, created_at)
    VALUES ('auction_prepare', CONCAT('Prepared ', v_count, ' auctions for weekend'), NOW());
END//

DELIMITER ;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 2️⃣ EVENT: تفعيل المزادات (السبت 00:00)
-- ═══════════════════════════════════════════════════════════════════════════════
DELIMITER //

DROP EVENT IF EXISTS auto_activate_auctions//

CREATE EVENT auto_activate_auctions
ON SCHEDULE EVERY 1 WEEK
STARTS (
    -- أقرب سبت الساعة 00:00:01
    TIMESTAMPADD(
        SECOND, 1,
        DATE_ADD(
            CURDATE(),
            INTERVAL (5 - WEEKDAY(CURDATE()) + 7) % 7 + 1 DAY
        )
    )
)
ON COMPLETION PRESERVE
ENABLE
COMMENT 'تفعيل المزادات المحضرة كل سبت 00:00'
DO
BEGIN
    DECLARE v_count INT DEFAULT 0;
    
    -- تفعيل جميع المزادات المعلقة
    UPDATE direct_sales
    SET 
        auction_status = 'active',
        updated_at = NOW()
    WHERE 
        auction_mode = 1
        AND auction_status = 'pending'
        AND auction_start_date <= NOW();
    
    SET v_count = ROW_COUNT();
    
    -- تسجيل العملية
    INSERT INTO system_logs (action, details, created_at)
    VALUES ('auction_activate', CONCAT('Activated ', v_count, ' auctions'), NOW());
END//

DELIMITER ;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 3️⃣ EVENT: إنهاء المزادات المنتهية (كل دقيقة)
-- ═══════════════════════════════════════════════════════════════════════════════
DELIMITER //

DROP EVENT IF EXISTS auto_end_expired_auctions//

CREATE EVENT auto_end_expired_auctions
ON SCHEDULE EVERY 1 MINUTE
STARTS CURRENT_TIMESTAMP
ON COMPLETION PRESERVE
ENABLE
COMMENT 'فحص وإنهاء المزادات المنتهية كل دقيقة'
DO
BEGIN
    DECLARE v_completed INT DEFAULT 0;
    DECLARE v_reserve_not_met INT DEFAULT 0;
    DECLARE v_no_bids INT DEFAULT 0;
    
    -- 1. ✅ المزادات الناجحة: أعلى مزايدة >= السعر الاحتياطي
    UPDATE direct_sales 
    SET 
        auction_status = 'completed',
        sale_status = 'reserved',
        updated_at = NOW()
    WHERE 
        auction_mode = 1
        AND auction_status = 'active'
        AND auction_end_date <= NOW()
        AND auction_bid_count > 0
        AND auction_current_bid IS NOT NULL
        AND auction_reserve_price IS NOT NULL
        AND auction_current_bid >= auction_reserve_price;
    
    SET v_completed = ROW_COUNT();
    
    -- 2. ⚠️ لم تصل للحد الأدنى: هناك مزايدات لكن أقل من السعر الاحتياطي
    UPDATE direct_sales 
    SET 
        auction_mode = 0,
        auction_status = 'reserve_not_met',
        sale_status = 'available',
        returned_from_auction_at = NOW(),
        updated_at = NOW()
    WHERE 
        auction_mode = 1
        AND auction_status = 'active'
        AND auction_end_date <= NOW()
        AND auction_bid_count > 0
        AND auction_current_bid IS NOT NULL
        AND auction_reserve_price IS NOT NULL
        AND auction_current_bid < auction_reserve_price;
    
    SET v_reserve_not_met = ROW_COUNT();
    
    -- 3. ❌ بدون مزايدات
    UPDATE direct_sales 
    SET 
        auction_mode = 0,
        auction_status = 'ended_no_bids',
        sale_status = 'available',
        returned_from_auction_at = NOW(),
        updated_at = NOW()
    WHERE 
        auction_mode = 1
        AND auction_status = 'active'
        AND auction_end_date <= NOW()
        AND (auction_bid_count = 0 OR auction_bid_count IS NULL);
    
    SET v_no_bids = ROW_COUNT();
    
    -- تسجيل العملية فقط إذا تم إنهاء مزادات
    IF (v_completed + v_reserve_not_met + v_no_bids) > 0 THEN
        INSERT INTO system_logs (action, details, created_at)
        VALUES (
            'auction_end', 
            CONCAT(
                'Completed: ', v_completed, 
                ', Reserve not met: ', v_reserve_not_met, 
                ', No bids: ', v_no_bids
            ), 
            NOW()
        );
    END IF;
END//

DELIMITER ;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 📋 إنشاء جدول system_logs إذا لم يكن موجوداً
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════════════════
-- 🔍 التحقق من الأحداث المنشأة
-- ═══════════════════════════════════════════════════════════════════════════════

-- عرض جميع الأحداث
SHOW EVENTS;

-- التحقق من event_scheduler
SHOW VARIABLES LIKE 'event_scheduler';

-- ═══════════════════════════════════════════════════════════════════════════════
-- 📌 ملاحظات مهمة:
-- ═══════════════════════════════════════════════════════════════════════════════
-- 
-- 1. تأكد من أن MySQL لديها صلاحية إنشاء Events:
--    GRANT EVENT ON your_database.* TO 'your_user'@'%';
--
-- 2. لتفعيل event_scheduler بشكل دائم، أضف هذا لملف my.cnf:
--    [mysqld]
--    event_scheduler = ON
--
-- 3. لاختبار الـ Events يدوياً:
--    - GET: /api/cron/auction-automation?action=prepare
--    - GET: /api/cron/auction-automation?action=activate
--    - GET: /api/cron/auction-automation?action=end
--
-- 4. للتشغيل اليدوي الكامل:
--    GET: /api/cron/auction-automation?action=run&secret=YOUR_CRON_SECRET
--
-- ═══════════════════════════════════════════════════════════════════════════════
