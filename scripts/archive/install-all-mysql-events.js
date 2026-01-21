/**
 * تثبيت كل MySQL Events للمزادات
 * 
 * 3 Events:
 * 1. إنهاء المزادات - كل أحد 23:59:59
 * 2. تحضير المزادات - كل جمعة 23:55
 * 3. تفعيل المزادات - كل سبت 00:00
 */

const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.local' });

async function main() {
  console.log('\n🔧 تثبيت كل MySQL Events للمزادات\n');
  console.log('='.repeat(60));

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.log('❌ DATABASE_URL غير موجود!');
    return;
  }

  let match = dbUrl.match(/mysql:\/\/([^:]+):([^@]*)@([^:]+):(\d+)\/(.+)/);
  if (!match) {
    console.log('❌ تنسيق DATABASE_URL غير صحيح!');
    return;
  }

  const [, user, password, host, port, database] = match;
  
  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      port: parseInt(port),
      user,
      password,
      database: database.split('?')[0],
      multipleStatements: true
    });

    console.log('✅ تم الاتصال بقاعدة البيانات\n');

    // 1️⃣ تفعيل Event Scheduler
    console.log('📦 تفعيل Event Scheduler...');
    try {
      await connection.query('SET GLOBAL event_scheduler = ON');
      console.log('   ✅ تم تفعيل Event Scheduler');
    } catch (e) {
      console.log('   ⚠️ ' + e.message);
    }

    // 2️⃣ حذف Events القديمة
    console.log('\n📦 حذف Events القديمة...');
    await connection.query('DROP EVENT IF EXISTS auto_end_expired_auctions');
    await connection.query('DROP EVENT IF EXISTS auto_prepare_auctions');
    await connection.query('DROP EVENT IF EXISTS auto_activate_auctions');
    console.log('   ✅ تم حذف Events القديمة');

    // ═══════════════════════════════════════════════════════════════
    // 3️⃣ Event لإنهاء المزادات (كل أحد 23:59:59)
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📦 إنشاء Event إنهاء المزادات (الأحد 23:59:59)...');
    
    // حساب الأحد القادم 23:59:59
    const [nextSundayRows] = await connection.query(`
      SELECT 
        DATE_FORMAT(
          DATE_ADD(
            DATE_ADD(CURDATE(), INTERVAL (6 - WEEKDAY(CURDATE()) + 7) % 7 DAY),
            INTERVAL '23:59:59' HOUR_SECOND
          ),
          '%Y-%m-%d %H:%i:%s'
        ) as next_sunday
    `);
    const nextSunday = nextSundayRows[0].next_sunday;
    console.log(`   📅 أول تشغيل: ${nextSunday}`);
    
    await connection.query(`
      CREATE EVENT auto_end_expired_auctions
      ON SCHEDULE EVERY 1 WEEK
      STARTS '${nextSunday}'
      ENABLE
      COMMENT 'إنهاء المزادات كل أحد 23:59:59 وإرجاع السيارات للبيع المباشر'
      DO
      BEGIN
        DECLARE v_now DATETIME DEFAULT NOW();
        
        -- المزادات الناجحة (مع فائز)
        UPDATE direct_sales 
        SET auction_status = 'completed', sale_status = 'reserved', updated_at = v_now
        WHERE auction_mode = 1 AND auction_status = 'active' AND auction_end_date <= v_now
          AND auction_bid_count > 0 AND auction_current_bid IS NOT NULL
          AND auction_current_bid >= auction_reserve_price;
        
        -- المزادات التي لم تصل للحد الأدنى
        UPDATE direct_sales 
        SET auction_mode = 0, auction_status = 'reserve_not_met', sale_status = 'available',
            returned_from_auction_at = v_now, updated_at = v_now
        WHERE auction_mode = 1 AND auction_status = 'active' AND auction_end_date <= v_now
          AND auction_bid_count > 0 AND auction_current_bid IS NOT NULL
          AND auction_current_bid < auction_reserve_price;
        
        -- المزادات بدون مزايدات
        UPDATE direct_sales 
        SET auction_mode = 0, auction_status = 'ended_no_bids', sale_status = 'available',
            returned_from_auction_at = v_now, updated_at = v_now
        WHERE auction_mode = 1 AND auction_status = 'active' AND auction_end_date <= v_now
          AND (auction_bid_count = 0 OR auction_bid_count IS NULL);
      END
    `);
    console.log('   ✅ تم إنشاء Event إنهاء المزادات');

    // ═══════════════════════════════════════════════════════════════
    // 4️⃣ Event لتحضير المزادات (كل جمعة 23:55)
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📦 إنشاء Event تحضير المزادات (الجمعة 23:55)...');
    
    // حساب الجمعة القادم 23:55
    const [nextFridayRows] = await connection.query(`
      SELECT 
        DATE_FORMAT(
          DATE_ADD(
            DATE_ADD(CURDATE(), INTERVAL (4 - WEEKDAY(CURDATE()) + 7) % 7 DAY),
            INTERVAL '23:55:00' HOUR_SECOND
          ),
          '%Y-%m-%d %H:%i:%s'
        ) as next_friday
    `);
    const nextFriday = nextFridayRows[0].next_friday;
    console.log(`   📅 أول تشغيل: ${nextFriday}`);
    
    await connection.query(`
      CREATE EVENT auto_prepare_auctions
      ON SCHEDULE EVERY 1 WEEK
      STARTS '${nextFriday}'
      ENABLE
      COMMENT 'تحضير السيارات المؤهلة للمزاد كل جمعة 23:55'
      DO
      BEGIN
        DECLARE v_now DATETIME DEFAULT NOW();
        DECLARE v_ten_days_ago DATETIME DEFAULT DATE_SUB(v_now, INTERVAL 10 DAY);
        DECLARE v_saturday DATETIME;
        DECLARE v_sunday DATETIME;
        
        -- حساب السبت 00:00 والأحد 23:59:59
        SET v_saturday = DATE_ADD(DATE(v_now), INTERVAL 1 DAY);
        SET v_sunday = DATE_ADD(v_saturday, INTERVAL 1 DAY);
        SET v_sunday = DATE_ADD(v_sunday, INTERVAL '23:59:59' HOUR_SECOND);
        
        -- تحضير السيارات المؤهلة
        UPDATE direct_sales 
        SET 
          auction_mode = 1,
          auction_status = 'pending',
          auction_start_date = v_saturday,
          auction_end_date = v_sunday,
          auction_current_bid = NULL,
          auction_winner_id = NULL,
          auction_bid_count = 0,
          moved_to_auction_at = v_now,
          updated_at = v_now
        WHERE 
          verification_status = 'approved'
          AND sale_status = 'available'
          AND auction_consent = 1
          AND auction_starting_price IS NOT NULL
          AND auction_reserve_price IS NOT NULL
          AND (auction_mode = 0 OR auction_mode IS NULL)
          AND created_at < v_ten_days_ago;
      END
    `);
    console.log('   ✅ تم إنشاء Event تحضير المزادات');

    // ═══════════════════════════════════════════════════════════════
    // 5️⃣ Event لتفعيل المزادات (كل سبت 00:00)
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📦 إنشاء Event تفعيل المزادات (السبت 00:00)...');
    
    // حساب السبت القادم 00:00
    const [nextSaturdayRows] = await connection.query(`
      SELECT 
        DATE_FORMAT(
          DATE_ADD(
            DATE_ADD(CURDATE(), INTERVAL (5 - WEEKDAY(CURDATE()) + 7) % 7 DAY),
            INTERVAL '00:00:00' HOUR_SECOND
          ),
          '%Y-%m-%d %H:%i:%s'
        ) as next_saturday
    `);
    const nextSaturday = nextSaturdayRows[0].next_saturday;
    console.log(`   📅 أول تشغيل: ${nextSaturday}`);
    
    await connection.query(`
      CREATE EVENT auto_activate_auctions
      ON SCHEDULE EVERY 1 WEEK
      STARTS '${nextSaturday}'
      ENABLE
      COMMENT 'تفعيل كل المزادات كل سبت 00:00'
      DO
      BEGIN
        UPDATE direct_sales 
        SET 
          auction_status = 'active',
          updated_at = NOW()
        WHERE 
          auction_mode = 1
          AND auction_status = 'pending'
          AND auction_start_date <= NOW();
      END
    `);
    console.log('   ✅ تم إنشاء Event تفعيل المزادات');

    // ═══════════════════════════════════════════════════════════════
    // 6️⃣ عرض ملخص Events
    // ═══════════════════════════════════════════════════════════════
    console.log('\n' + '='.repeat(60));
    
    const [eventRows] = await connection.query(`
      SELECT EVENT_NAME, STATUS, INTERVAL_VALUE, INTERVAL_FIELD, STARTS
      FROM information_schema.EVENTS 
      WHERE EVENT_SCHEMA = ?
    `, [database.split('?')[0]]);

    console.log('\n📋 Events المثبتة:');
    if (eventRows.length > 0) {
      eventRows.forEach((e) => {
        console.log(`   ✅ ${e.EVENT_NAME}`);
        console.log(`      التكرار: كل ${e.INTERVAL_VALUE} ${e.INTERVAL_FIELD}`);
        console.log(`      أول تشغيل: ${e.STARTS}`);
        console.log(`      الحالة: ${e.STATUS}`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('\n🎉 تم تثبيت كل MySQL Events بنجاح!');
    console.log('\n📝 ما سيحدث تلقائياً:');
    console.log('   ✅ كل جمعة 23:55: تحضير السيارات للمزاد');
    console.log('   ✅ كل سبت 00:00: تفعيل المزادات');
    console.log('   ✅ كل أحد 23:59:59: إنهاء المزادات');
    console.log('\n⚡ المزايا:');
    console.log('   - يعمل حتى لو السيرفر (Node.js) متوقف');
    console.log('   - لا يستهلك موارد من التطبيق');
    console.log('   - 100% موثوق ودقيق');
    console.log('   - لا يحتاج صيانة');
    
    console.log('\n🗑️ يمكنك الآن حذف:');
    console.log('   - lib/smart-scheduler.ts (لم يعد مطلوباً)');

  } catch (error) {
    console.error('\n❌ خطأ:', error.message);
    
    if (error.message.includes('EVENT')) {
      console.log('\n⚠️ تحتاج صلاحيات EVENT. شغّل:');
      console.log(`   GRANT EVENT ON ${database.split('?')[0]}.* TO '${user}'@'%';`);
    }
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

main();
