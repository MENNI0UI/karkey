# دليل إعداد قاعدة بيانات MySQL - الطريقة السهلة

هذا الدليل سيساعدك على إعداد قاعدة بيانات MySQL لمشروع Karkey بطريقة بسيطة وسهلة.

## الهيكل المنظم

\`\`\`
backend/
└── src/
    ├── database/
    │   ├── index.js          ← الاتصال بقاعدة البيانات
    │   ├── schema.sql        ← جميع الجداول
    │   ├── seed.js           ← بيانات تجريبية
    │   └── orm/              ← نماذج الجداول
    │       ├── user.model.js
    │       └── verification.model.js
└── scripts/
    ├── setup.js              ← إنشاء قاعدة البيانات
    └── reset.js              ← إعادة تعيين قاعدة البيانات
\`\`\`

---

## الخطوات السريعة

### 1. تشغيل MySQL في XAMPP

1. افتح **XAMPP Control Panel**
2. اضغط **Start** بجانب **MySQL**
3. انتظر حتى يبدأ MySQL (سيظهر بخلفية خضراء)

### 2. تأكد من ملف `.env.local`

تحقق من وجود الملف وأن الإعدادات صحيحة:

\`\`\`env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=karkey
\`\`\`

إذا كنت قد وضعت كلمة مرور لـ MySQL، قم بتحديث `DB_PASSWORD`

### 3. تثبيت الحزم

\`\`\`bash
npm install
\`\`\`

### 4. إنشاء قاعدة البيانات

\`\`\`bash
npm run db:setup
\`\`\`

هذا كل شيء! تم إنشاء قاعدة البيانات والجداول.

### 5. إضافة بيانات تجريبية (اختياري)

\`\`\`bash
npm run db:seed
\`\`\`

---

## الأوامر المتاحة

### إنشاء قاعدة البيانات والجداول
\`\`\`bash
npm run db:setup
\`\`\`

### إعادة تعيين قاعدة البيانات (حذف كل البيانات)
\`\`\`bash
npm run db:reset
\`\`\`

تحذير: هذا سيحذف جميع البيانات!

### إضافة بيانات تجريبية
\`\`\`bash
npm run db:seed
\`\`\`

---

## إضافة أو تعديل الجداول

**الطريقة السهلة:**

1. افتح ملف `backend/src/database/schema.sql`
2. أضف أو عدل الجداول مباشرة في الملف
3. شغل `npm run db:reset` ثم `npm run db:setup`

**مثال: إضافة جدول جديد للسيارات**

افتح `backend/src/database/schema.sql` وأضف في النهاية:

\`\`\`sql
-- ============================================
-- جدول السيارات (VEHICLES)
-- ============================================
CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  image VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
\`\`\`

ثم شغل:
\`\`\`bash
npm run db:setup
\`\`\`

---

## بنية قاعدة البيانات الحالية

### 1. جدول المستخدمين (users)

| الحقل | النوع | الوصف |
|------|------|-------|
| id | INT | المعرف الفريد |
| username | VARCHAR(20) | اسم المستخدم (3-20 حرف) |
| email | VARCHAR(255) | البريد الإلكتروني (فريد) |
| password | VARCHAR(255) | كلمة المرور (مشفرة بـ bcrypt) |
| phone_number | VARCHAR(20) | رقم الهاتف المغربي (+212XXXXXXXXX) |
| user_type | ENUM | نوع المستخدم (individual, dealer, company) |
| verification_status | ENUM | حالة التحقق (pending, approved, rejected) |
| created_at | TIMESTAMP | تاريخ الإنشاء |
| updated_at | TIMESTAMP | تاريخ آخر تحديث |

### 2. جدول التحقق من الهوية (verifications)

| الحقل | النوع | الوصف |
|------|------|-------|
| id | INT | المعرف الفريد |
| user_id | INT | معرف المستخدم (Foreign Key) |
| cin_number | VARCHAR(12) | رقم البطاقة الوطنية (فريد) |
| cin_front | VARCHAR(500) | مسار صورة البطاقة الأمامية |
| cin_back | VARCHAR(500) | مسار صورة البطاقة الخلفية |
| selfie_with_cin | VARCHAR(500) | مسار صورة السيلفي مع البطاقة |
| status | ENUM | حالة التحقق (pending, approved, rejected) |
| rejected_reason | TEXT | سبب الرفض |
| created_at | TIMESTAMP | تاريخ الإنشاء |
| updated_at | TIMESTAMP | تاريخ آخر تحديث |
| reviewed_at | TIMESTAMP | تاريخ المراجعة |

---

## قواعد التحقق من البيانات

### اسم المستخدم
- 3-20 حرف فقط
- حروف، أرقام، وشرطة سفلية فقط
- مثال: `ahmed_123`

### البريد الإلكتروني
- صيغة بريد إلكتروني صحيحة
- يجب أن يكون فريداً
- مثال: `user@example.com`

### كلمة المرور
- 8-30 حرف
- حرف كبير واحد على الأقل
- رقم واحد على الأقل
- مثال: `MyPass123`

### رقم الهاتف المغربي
- يبدأ بـ +212
- متبوع بـ 9 أرقام
- مثال: `+212612345678`

### رقم البطاقة الوطنية (CIN)
- 1-4 حروف كبيرة + 1-8 أرقام
- أمثلة: `A123456`, `AB1234567`, `ABCD12345678`

### الصور
- الصيغ المسموحة: JPG, PNG
- الحجم الأقصى: 5MB لكل صورة

---

## استخدام قاعدة البيانات في الكود

### الطريقة 1: استخدام النماذج (Models) - موصى بها

\`\`\`javascript
const User = require('@/backend/src/database/orm/user.model')
const Verification = require('@/backend/src/database/orm/verification.model')

// مثال: إنشاء مستخدم جديد
const userId = await User.create({
  username: 'ahmed_123',
  email: 'ahmed@example.com',
  password: 'MyPass123',
  phone_number: '+212612345678',
  user_type: 'individual'
})

// مثال: البحث عن مستخدم
const user = await User.findByEmail('ahmed@example.com')

// مثال: إنشاء طلب تحقق
await Verification.create({
  user_id: userId,
  cin_number: 'AB123456',
  cin_front: '/uploads/cin_front.jpg',
  cin_back: '/uploads/cin_back.jpg',
  selfie_with_cin: '/uploads/selfie.jpg'
})
\`\`\`

### الطريقة 2: استخدام الاستعلامات المباشرة

\`\`\`javascript
const db = require('@/backend/src/database')

// مثال: الحصول على جميع المستخدمين
const users = await db.query('SELECT * FROM users')

// مثال: الحصول على مستخدم واحد
const user = await db.queryOne('SELECT * FROM users WHERE id = ?', [userId])

// مثال: إضافة مستخدم جديد
await db.query(
  'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
  [username, email, hashedPassword]
)
\`\`\`

---

## حل المشاكل

### MySQL لا يبدأ في XAMPP
- تحقق من أن المنفذ 3306 غير مستخدم
- حاول تغيير منفذ MySQL في إعدادات XAMPP

### لا يمكن الاتصال بقاعدة البيانات
- تحقق من أن MySQL يعمل في XAMPP
- تحقق من إعدادات ملف `.env.local`
- تأكد من صحة اسم المستخدم وكلمة المرور

### أخطاء الصلاحيات
- تأكد من أن مستخدم MySQL لديه الصلاحيات المناسبة
- حاول تشغيل XAMPP كمسؤول

### خطأ "Cannot find module"
- تأكد من تشغيل `npm install`
- تحقق من المسارات في ملفات require/import

---

**مهم**: لا تقم أبداً برفع ملف `.env.local` إلى GitHub! يحتوي على بيانات حساسة.
