/**
 * إنهاء المزادات المنتهية
 * 
 * هذا السكريبت يقوم بإنهاء كل المزادات التي انتهى وقتها
 * - السيارات بدون مزايدات ترجع للبيع المباشر
 * - السيارات مع مزايدات فائزة تُغلق كـ "مكتملة"
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n🔄 إنهاء المزادات المنتهية\n');
  console.log('='.repeat(50));

  const now = new Date();
  
  try {
    // 1. عرض المزادات النشطة
    const activeAuctions = await prisma.direct_sales.findMany({
      where: {
        auction_mode: true,
        auction_status: 'active'
      },
      select: {
        id: true,
        make: true,
        model: true,
        auction_end_date: true,
        auction_bid_count: true,
        auction_current_bid: true,
        auction_reserve_price: true,
      }
    });

    console.log(`📋 المزادات النشطة: ${activeAuctions.length}`);
    
    for (const auction of activeAuctions) {
      const isExpired = auction.auction_end_date && auction.auction_end_date < now;
      const status = isExpired ? '⏰ منتهي' : '🟢 جاري';
      console.log(`   - ID ${auction.id}: ${auction.make} ${auction.model} | ${status} | مزايدات: ${auction.auction_bid_count || 0}`);
    }

    // 2. إنهاء المزادات
    console.log('\n🔄 جاري إنهاء المزادات المنتهية...\n');

    // 2.1 المزادات الناجحة
    const completedResult = await prisma.$executeRaw`
      UPDATE direct_sales 
      SET 
        auction_status = 'completed',
        sale_status = 'reserved',
        updated_at = ${now}
      WHERE 
        auction_mode = true
        AND auction_status = 'active'
        AND auction_end_date <= ${now}
        AND auction_bid_count > 0
        AND auction_current_bid IS NOT NULL
        AND auction_reserve_price IS NOT NULL
        AND auction_current_bid >= auction_reserve_price
    `;

    // 2.2 المزادات التي لم تصل للحد الأدنى
    const reserveNotMetResult = await prisma.$executeRaw`
      UPDATE direct_sales 
      SET 
        auction_mode = false,
        auction_status = 'reserve_not_met',
        sale_status = 'available',
        returned_from_auction_at = ${now},
        updated_at = ${now}
      WHERE 
        auction_mode = true
        AND auction_status = 'active'
        AND auction_end_date <= ${now}
        AND auction_bid_count > 0
        AND auction_current_bid IS NOT NULL
        AND auction_reserve_price IS NOT NULL
        AND auction_current_bid < auction_reserve_price
    `;

    // 2.3 المزادات بدون مزايدات
    const noBidsResult = await prisma.$executeRaw`
      UPDATE direct_sales 
      SET 
        auction_mode = false,
        auction_status = 'ended_no_bids',
        sale_status = 'available',
        returned_from_auction_at = ${now},
        updated_at = ${now}
      WHERE 
        auction_mode = true
        AND auction_status = 'active'
        AND auction_end_date <= ${now}
        AND (auction_bid_count = 0 OR auction_bid_count IS NULL)
    `;

    console.log('📊 النتائج:');
    console.log(`   ✅ مكتملة (مع فائز): ${completedResult}`);
    console.log(`   ⚠️ لم تصل للحد الأدنى: ${reserveNotMetResult}`);
    console.log(`   ❌ بدون مزايدات: ${noBidsResult}`);

    const total = Number(completedResult) + Number(reserveNotMetResult) + Number(noBidsResult);
    console.log(`\n📈 المجموع: ${total} مزاد تم إنهاؤه`);

    // 3. عرض السيارات التي عادت للبيع المباشر
    const returnedCars = await prisma.direct_sales.findMany({
      where: {
        auction_status: { in: ['ended_no_bids', 'reserve_not_met'] },
        returned_from_auction_at: { gte: new Date(now.getTime() - 60000) } // آخر دقيقة
      },
      select: {
        id: true,
        make: true,
        model: true,
        auction_status: true,
        price: true,
      }
    });

    if (returnedCars.length > 0) {
      console.log('\n🔙 السيارات التي عادت للبيع المباشر:');
      for (const car of returnedCars) {
        const reason = car.auction_status === 'ended_no_bids' ? 'بدون مزايدات' : 'لم تصل للحد الأدنى';
        console.log(`   - ID ${car.id}: ${car.make} ${car.model} (${reason}) - ${car.price} درهم`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ تم الانتهاء!');

  } catch (error) {
    console.error('\n❌ خطأ:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
