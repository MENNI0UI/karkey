const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function dropOldTables() {
  console.log('🗑️ حذف الجداول القديمة...\n');

  try {
    // تعطيل فحص المفاتيح الأجنبية مؤقتاً
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 0`;
    console.log('🔓 تم تعطيل فحص المفاتيح الأجنبية\n');

    // حذف الجداول
    const tables = ['bids', 'watchlist', 'vehicle_photos', 'auctions', 'vehicles'];
    
    for (const table of tables) {
      console.log(`حذف جدول ${table}...`);
      await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS ${table}`);
      console.log(`   ✅ تم`);
    }

    // إعادة تفعيل فحص المفاتيح الأجنبية
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;
    console.log('\n🔒 تم إعادة تفعيل فحص المفاتيح الأجنبية');

    console.log('\n✅ تم حذف جميع الجداول القديمة بنجاح!');

  } catch (error) {
    console.error('❌ خطأ:', error);
    // تأكد من إعادة تفعيل فحص المفاتيح حتى لو حدث خطأ
    await prisma.$executeRaw`SET FOREIGN_KEY_CHECKS = 1`;
  } finally {
    await prisma.$disconnect();
  }
}

dropOldTables();
