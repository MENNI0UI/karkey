// سكريبت إنشاء مزاد تجريبي للاختبار
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createTestAuction() {
  try {
    // تاريخ البدء: الآن
    const startDate = new Date();
    // تاريخ الانتهاء: بعد 10 دقائق للاختبار السريع
    const endDate = new Date(Date.now() + 10 * 60 * 1000);
    
    // البحث عن مستخدم موجود
    const user = await prisma.users.findFirst();
    if (!user) {
      console.log('❌ لا يوجد مستخدمين في قاعدة البيانات');
      return;
    }
    
    console.log('👤 المستخدم:', user.username || user.email);
    
    // إنشاء مزاد تجريبي
    const auction = await prisma.direct_sales.create({
      data: {
        user_id: user.id,
        make: 'Toyota',
        model: 'Camry TEST',
        year: 2023,
        mileage: 50000,
        transmission: 'automatic',
        fuel_type: 'gasoline',
        vehicle_condition: 'excellent',
        location: 'Casablanca',
        description: 'سيارة تجريبية للاختبار - يمكن حذفها لاحقاً',
        price: 150000,
        verification_status: 'approved',
        sale_status: 'available',
        // حقول المزاد
        auction_mode: true,
        auction_status: 'active',
        auction_starting_price: 100000,
        auction_reserve_price: 120000,
        auction_current_bid: null,
        auction_start_date: startDate,
        auction_end_date: endDate,
      }
    });
    
    console.log('');
    console.log('✅ تم إنشاء مزاد تجريبي بنجاح!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('   ID:', auction.id);
    console.log('   السيارة:', auction.make, auction.model, auction.year);
    console.log('   السعر الابتدائي:', auction.auction_starting_price, 'MAD');
    console.log('   تاريخ البدء:', startDate.toLocaleString());
    console.log('   تاريخ الانتهاء:', endDate.toLocaleString());
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('🔗 روابط الاختبار:');
    console.log('   http://localhost:3000/ar/auctions');
    console.log('   http://localhost:3000/ar/auctions/' + auction.id);
    console.log('');
    
  } catch (error) {
    console.error('❌ خطأ:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAuction();
