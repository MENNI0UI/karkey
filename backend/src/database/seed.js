// ============================================
// بيانات تجريبية أولية (Seed Data)
// ============================================
// استخدم هذا الملف لإضافة بيانات تجريبية لاختبار التطبيق
// ============================================

require("dotenv").config()
const User = require("./orm/user.model")
const Verification = require("./orm/verification.model")

async function seed() {
  try {
    console.log("🌱 بدء إضافة البيانات التجريبية...")

    // إنشاء مستخدمين تجريبيين
    const user1Id = await User.create({
      username: "test_user",
      email: "test@example.com",
      password: process.env.SEED_USER_PASSWORD || ("TestUser" + Date.now().toString(36)),
      phone_number: "+212612345678",
      user_type: "individual",
    })

    const user2Id = await User.create({
      username: "dealer_test",
      email: "dealer@example.com",
      password: process.env.SEED_DEALER_PASSWORD || ("Dealer" + Date.now().toString(36)),
      phone_number: "+212623456789",
      user_type: "dealer",
    })

    console.log("✅ تم إنشاء المستخدمين التجريبيين")

    // إنشاء طلبات تحقق تجريبية
    await Verification.create({
      user_id: user1Id,
      cin_number: "AB123456",
      cin_front: "/uploads/cin_front_test.jpg",
      cin_back: "/uploads/cin_back_test.jpg",
      selfie_with_cin: "/uploads/selfie_test.jpg",
    })

    console.log("✅ تم إنشاء طلبات التحقق التجريبية")
    console.log("🎉 تم إضافة جميع البيانات التجريبية بنجاح!")

    process.exit(0)
  } catch (error) {
    console.error("❌ خطأ في إضافة البيانات التجريبية:", error)
    process.exit(1)
  }
}

seed()
