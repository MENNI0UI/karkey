const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('\n📋 فحص أهلية السيارات للمزاد التلقائي\n');
  console.log('='.repeat(70));

  const cars = await prisma.direct_sales.findMany({
    select: {
      id: true,
      make: true,
      model: true,
      auction_consent: true,
      auction_starting_price: true,
      auction_reserve_price: true,
      created_at: true,
      verification_status: true,
      sale_status: true,
      auction_mode: true,
    }
  });

  console.log('\nشروط التحويل التلقائي للمزاد:');
  console.log('  ✅ verification_status = approved');
  console.log('  ✅ sale_status = available');
  console.log('  ✅ auction_consent = true (موافقة المالك)');
  console.log('  ✅ auction_starting_price موجود');
  console.log('  ✅ auction_reserve_price موجود');
  console.log('  ✅ عمر السيارة > 10 أيام');
  console.log('  ✅ auction_mode = false (ليست في مزاد)');
  console.log('\n' + '-'.repeat(70));

  for (const car of cars) {
    const age = Math.floor((Date.now() - new Date(car.created_at).getTime()) / (1000 * 60 * 60 * 24));
    
    const checks = {
      verified: car.verification_status === 'approved',
      available: car.sale_status === 'available',
      consent: car.auction_consent === true,
      startPrice: car.auction_starting_price !== null,
      reservePrice: car.auction_reserve_price !== null,
      oldEnough: age >= 10,
      notInAuction: car.auction_mode !== true,
    };

    const allPassed = Object.values(checks).every(v => v);

    console.log(`\n🚗 ID ${car.id}: ${car.make} ${car.model}`);
    console.log(`   ${checks.verified ? '✅' : '❌'} موثقة: ${car.verification_status}`);
    console.log(`   ${checks.available ? '✅' : '❌'} متاحة: ${car.sale_status}`);
    console.log(`   ${checks.consent ? '✅' : '❌'} موافقة المالك: ${car.auction_consent || 'لا'}`);
    console.log(`   ${checks.startPrice ? '✅' : '❌'} سعر البداية: ${car.auction_starting_price || 'غير محدد'}`);
    console.log(`   ${checks.reservePrice ? '✅' : '❌'} السعر الاحتياطي: ${car.auction_reserve_price || 'غير محدد'}`);
    console.log(`   ${checks.oldEnough ? '✅' : '❌'} العمر: ${age} يوم (يجب > 10)`);
    console.log(`   ${checks.notInAuction ? '✅' : '❌'} ليست في مزاد: ${!car.auction_mode}`);
    console.log(`   ────────────────────────────────`);
    console.log(`   🎯 ${allPassed ? '✅ ستدخل المزاد السبت القادم' : '❌ لن تدخل المزاد (شروط ناقصة)'}`);
  }

  console.log('\n' + '='.repeat(70));
  await prisma.$disconnect();
}

main();
