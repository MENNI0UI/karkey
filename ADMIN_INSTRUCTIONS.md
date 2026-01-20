# تعليمات إنشاء حساب مسؤول (Admin)

## الطريقة 1: عبر phpMyAdmin (الأسهل)

1. افتح `http://localhost/phpmyadmin`
2. اختر قاعدة البيانات `karkey`
3. اضغط على جدول `admins`
4. اضغط على تبويب **Insert** (إدراج)
5. املأ الحقول التالية:
   - **nom**: اسم العائلة (مثال: Alami)
   - **prenom**: الاسم الأول (مثال: Ahmed)
   - **password_hash**: اترك فارغاً الآن
   - **role**: اختر من القائمة (ceo, verification, finance, support)
6. **لا تضغط Go بعد!**

### تشفير كلمة المرور:

افتح موقع: https://bcrypt-generator.com/
- اكتب كلمة المرور التي تريدها (مثال: admin123)
- اضغط **Generate**
- انسخ النتيجة (تبدأ بـ $2a$ أو $2b$)
- الصقها في حقل **password_hash** في phpMyAdmin
- الآن اضغط **Go**

## الطريقة 2: عبر SQL مباشرة

افتح phpMyAdmin → SQL tab → الصق هذا الكود:

\`\`\`sql
-- استبدل القيم بالمعلومات التي تريدها
INSERT INTO admins (nom, prenom, password_hash, role) 
VALUES (
  'Alami',  -- اسم العائلة
  'Ahmed',  -- الاسم الأول
  '$2b$10$YourHashedPasswordHere',  -- كلمة المرور المشفرة
  'ceo'  -- الدور: ceo, verification, finance, support
);
\`\`\`

**ملاحظة:** يجب تشفير كلمة المرور أولاً من https://bcrypt-generator.com/

## تسجيل الدخول

بعد إنشاء الحساب:
1. اذهب إلى `http://localhost:3000/admin/login`
2. أدخل:
   - **Nom** (اسم العائلة): Alami
   - **Prenom** (الاسم الأول): Ahmed
   - **Mot de passe** (كلمة المرور): admin123 (أو الكلمة التي اخترتها)
3. اضغط **Se connecter**

## مثال كامل:

\`\`\`sql
-- مثال: إنشاء مسؤول CEO
-- كلمة المرور: admin123
INSERT INTO admins (nom, prenom, password_hash, role) 
VALUES (
  'Alami', 
  'Ahmed', 
  '$2b$10$rQZ5YvU9X.vQqH5YvU9X.uK5YvU9X.vQqH5YvU9X.uK5YvU9X.vQqH',
  'ceo'
);
\`\`\`

## الأدوار المتاحة:
- **ceo**: المدير التنفيذي (صلاحيات كاملة)
- **verification**: موظف التحقق (يتحقق من هويات المستخدمين)
- **finance**: موظف المالية
- **support**: موظف الدعم الفني
