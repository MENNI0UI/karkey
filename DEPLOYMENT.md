# 🚀 خطوات نشر موقع Karkey

## 1. رفع الملفات
رفع كل ملفات المشروع إلى الاستضافة (بدون `node_modules` و `.next`)

## 2. تثبيت الحزم
```bash
npm install
```

## 3. إعداد ملف البيئة
```bash
cp .env.example .env.local
```
ثم عدّل المتغيرات:

### متغيرات إجبارية:
```env
# قاعدة البيانات
DATABASE_URL=mysql://user:pass@host:3306/karkey
DB_HOST=your-host
DB_PORT=3306
DB_USER=your-user
DB_PASSWORD=your-password
DB_NAME=karkey

# المصادقة (⚠️ غيّر هذا!)
JWT_SECRET=your-random-secret-minimum-32-characters

# رابط الموقع
NEXT_PUBLIC_SITE_URL=https://yoursite.com

# التخزين
STORAGE_DRIVER=local
```

### متغيرات S3 (إذا كنت تستخدم S3):
```env
STORAGE_DRIVER=s3
S3_BUCKET=your-bucket
S3_REGION=your-region
S3_KEY=your-access-key
S3_SECRET=your-secret-key
```

## 4. إعداد قاعدة البيانات

### أ. استيراد الجداول
من phpMyAdmin، قم باستيراد قاعدة البيانات

### ب. ⚠️ مهم جداً: تثبيت MySQL Events
**MySQL Events لا تُصدَّر تلقائياً مع قاعدة البيانات!**

بعد استيراد قاعدة البيانات، شغّل:
```bash
node scripts/install-all-mysql-events.js
```

## 5. إنشاء حساب أدمن (مرة واحدة)
```bash
ADMIN_NOM=LastName ADMIN_PRENOM=FirstName ADMIN_PASSWORD=SecurePass123 npm run admin:create
```

## 6. بناء المشروع
```bash
npm run build
```

## 7. تشغيل الموقع
```bash
npm start
```

---

## ✅ التحقق من MySQL Events

بعد التثبيت، تحقق من أن الـ Events تعمل:

```sql
-- في phpMyAdmin > SQL:
SHOW EVENTS;
```

يجب أن ترى 3 Events:
| Event | الجدول الزمني |
|-------|--------------|
| `auto_prepare_auctions` | كل أسبوع (الجمعة 23:55) |
| `auto_activate_auctions` | كل أسبوع (السبت 00:00) |
| `auto_end_expired_auctions` | كل أسبوع (الأحد 23:59:59) |

---

## 🔧 استكشاف الأخطاء

### الـ Events لا تعمل؟
```sql
-- تحقق من أن Event Scheduler مفعّل
SHOW VARIABLES LIKE 'event_scheduler';

-- إذا كان OFF:
SET GLOBAL event_scheduler = ON;
```

### لإعادة تثبيت الـ Events:
```bash
node scripts/install-all-mysql-events.js
```

---

## ❌ لا تحتاج إلى:

- ❌ `npm run db:setup` - إذا استوردت قاعدة البيانات من phpMyAdmin
- ❌ `npm run cron:complete-auctions` - MySQL Events تفعل هذا تلقائياً
- ❌ أي cron job خارجي - MySQL Events تكفي
- ❌ أي سكريبتات أخرى
