/**
 * إنشاء سيارة اختبار تستوفي جميع شروط المزاد التلقائي
 * 
 * الشروط المطلوبة:
 * ✅ verification_status = approved
 * ✅ sale_status = available
 * ✅ auction_consent = true
 * ✅ auction_starting_price موجود
 * ✅ auction_reserve_price موجود
 * ✅ عمر السيارة > 10 أيام
 * ✅ auction_mode = false
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n🚗 إنشاء سيارة اختبار تستوفي شروط المزاد التلقائي\n');
  console.log('='.repeat(60));

  try {
    // الحصول على مستخدم
    const user = await prisma.users.findFirst();
    if (!user) {
      console.log('❌ لا يوجد مستخدم!');
      return;
    }

    // تاريخ قبل 15 يوم (لتحقيق شرط > 10 أيام)
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    // إنشاء السيارة
    const testCar = await prisma.direct_sales.create({
      data: {
        user_id: user.id,
        make: 'AUDI',
        model: 'A4 - AUTO AUCTION TEST',
        year: 2023,
        price: 350000,
        mileage: 25000,
        fuel_type: 'gasoline',
        transmission: 'automatic',
        vehicle_condition: 'excellent',
        location: 'Casablanca',
        description: 'سيارة اختبار للتحويل التلقائي للمزاد - تستوفي جميع الشروط',
        exterior_color: 'black',
        interior_color: 'beige',
        doors: '4',
        engine_size: '2.0',
        
        // ✅ شروط التوثيق
        verification_status: 'approved',
        sale_status: 'available',
        
        // ✅ شروط المزاد - الموافقة والأسعار
        auction_consent: true,
        auction_starting_price: 280000,  // سعر البداية
        auction_reserve_price: 320000,   // السعر الاحتياطي (لن تُباع بأقل منه)
        
        // ✅ ليست في مزاد حالياً
        auction_mode: false,
        auction_status: 'none',
        
        // ✅ تاريخ قديم (15 يوم) لتحقيق شرط العمر
        created_at: fifteenDaysAgo,
        updated_at: new Date(),
      }
    });

    console.log(`\n✅ تم إنشاء سيارة الاختبار بنجاح!`);
    console.log(`\n📋 تفاصيل السيارة:`);
    console.log(`   ID: ${testCar.id}`);
    console.log(`   الماركة: ${testCar.make} ${testCar.model}`);
    console.log(`   السعر المباشر: ${testCar.price} درهم`);
    console.log(`   سعر بداية المزاد: ${testCar.auction_starting_price} درهم`);
    console.log(`   السعر الاحتياطي: ${testCar.auction_reserve_price} درهم`);

    // التحقق من الشروط
    const age = Math.floor((Date.now() - new Date(testCar.created_at).getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`\n📊 التحقق من الشروط:`);
    console.log(`   ✅ موثقة: ${testCar.verification_status}`);
    console.log(`   ✅ متاحة: ${testCar.sale_status}`);
    console.log(`   ✅ موافقة المالك: ${testCar.auction_consent}`);
    console.log(`   ✅ سعر البداية: ${testCar.auction_starting_price}`);
    console.log(`   ✅ السعر الاحتياطي: ${testCar.auction_reserve_price}`);
    console.log(`   ✅ العمر: ${age} يوم (> 10 ✓)`);
    console.log(`   ✅ ليست في مزاد: ${!testCar.auction_mode}`);

    console.log(`\n${'='.repeat(60)}`);
    console.log(`🎯 هذه السيارة ستدخل المزاد تلقائياً يوم الجمعة 23:55!`);
    console.log(`\n📅 الجدول الزمني:`);
    console.log(`   • الجمعة 23:55 → ستتحول لـ auction_status = "pending"`);
    console.log(`   • السبت 00:00 → ستتحول لـ auction_status = "active"`);
    console.log(`   • الأحد 23:59 → سينتهي المزاد`);
    
    console.log(`\n💡 لاختبار التحويل الآن، شغّل:`);
    console.log(`   node -e "fetch('http://localhost:3000/api/cron/auction-automation?action=prepare')"`);

  } catch (error) {
    console.error('\n❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
