# Registration Troubleshooting Guide

This guide will help you debug and fix registration issues in the Karkey application.

## Quick Diagnostic Test

Visit `http://localhost:3000/debug` to run automated database tests.

## Step-by-Step Troubleshooting

### Step 1: Verify XAMPP is Running

1. Open XAMPP Control Panel
2. Ensure **MySQL** service is running (green indicator)
3. If not running, click **Start** next to MySQL

### Step 2: Check Environment Variables

Open `.env.local` file and verify:

\`\`\`env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=
DB_NAME=karkey
DB_PORT=3306
JWT_SECRET=your-secret-key-here
\`\`\`

**Important Notes:**
- `DB_HOST` must be `127.0.0.1` (not `localhost`) for XAMPP
- `DB_PASSWORD` is empty by default in XAMPP
- `JWT_SECRET` should be a random string (at least 32 characters)

### Step 3: Create Database and Tables

Run the setup script:

\`\`\`bash
npm run db:setup
\`\`\`

**Expected Output:**
\`\`\`
✅ تم الاتصال بـ MySQL
✅ تم إنشاء قاعدة البيانات والجداول بنجاح
🎉 الإعداد مكتمل!
\`\`\`

**If you see errors:**
- Check that MySQL is running in XAMPP
- Verify database credentials in `.env.local`
- Check MySQL error logs in XAMPP

### Step 4: Test Database Connection

Visit: `http://localhost:3000/api/debug/db-test`

This will return JSON with test results. All tests should show `"status": "PASSED"`.

**Common Errors:**

#### Error: "ECONNREFUSED"
- **Cause:** MySQL is not running
- **Fix:** Start MySQL in XAMPP Control Panel

#### Error: "Access denied for user"
- **Cause:** Wrong database credentials
- **Fix:** Check `DB_USER` and `DB_PASSWORD` in `.env.local`

#### Error: "Unknown database 'karkey'"
- **Cause:** Database not created
- **Fix:** Run `npm run db:setup`

#### Error: "Table 'users' doesn't exist"
- **Cause:** Tables not created
- **Fix:** Run `npm run db:setup`

### Step 5: Test Registration

1. Go to `http://localhost:3000/auth/register`
2. Open browser console (F12)
3. Fill out the registration form
4. Click "Create Account"
5. Watch the console for detailed logs

**Console Logs to Look For:**

\`\`\`
[v0 CLIENT] Step 1: Starting registration...
[v0 CLIENT] Step 2: Converting files to base64...
[v0 CLIENT] Step 3: Calling server action...
[v0 SERVER] ========== REGISTRATION ACTION STARTED ==========
[v0 SERVER] Step 1: Validating username...
...
[v0 SERVER] ✅ REGISTRATION COMPLETED SUCCESSFULLY
\`\`\`

**If registration fails:**
- Check for red ❌ marks in console logs
- The error message will indicate which step failed
- Common issues:
  - Invalid email format
  - Weak password
  - Invalid phone number format
  - Missing or invalid CIN
  - File upload errors

### Step 6: Check Server Logs

In your terminal where `npm run dev` is running, look for:

\`\`\`
[v0 SERVER] ========== REGISTRATION ACTION STARTED ==========
\`\`\`

This shows detailed server-side processing. Any errors will be logged here.

### Step 7: Verify Database Entries

After successful registration, check the database:

1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Select `karkey` database
3. Check `users` table - should have new entry
4. Check `verifications` table - should have verification record

## Common Issues and Solutions

### Issue: "Registration failed. Please check server logs."

**Possible Causes:**
1. Database connection failed
2. File upload failed
3. Validation error
4. Database insert error

**Solution:**
1. Check browser console for client-side errors
2. Check terminal for server-side errors
3. Run database diagnostic: `http://localhost:3000/debug`
4. Verify all environment variables are set

### Issue: Files not uploading

**Check:**
1. `public/uploads/` directory exists
2. Directory has write permissions
3. Files are under 5MB
4. Files are jpg/png format

**Fix:**
\`\`\`bash
mkdir -p public/uploads
chmod 755 public/uploads
\`\`\`

### Issue: Password validation fails

**Requirements:**
- 8-30 characters
- At least one uppercase letter
- At least one number

**Example valid password:** `MyPass123`

### Issue: Phone number validation fails

**Format:** `+212` followed by 9 digits

**Examples:**
- ✅ `+212612345678`
- ✅ `+212712345678`
- ❌ `0612345678` (missing +212)
- ❌ `+21261234567` (only 8 digits)

### Issue: CIN validation fails

**Format:** 1-4 uppercase letters followed by 1-8 numbers

**Examples:**
- ✅ `A123456`
- ✅ `AB1234567`
- ✅ `ABCD12345678`
- ❌ `a123456` (lowercase)
- ❌ `123456` (no letters)

## Advanced Debugging

### Enable Detailed Logging

All server actions already have detailed logging. Check your terminal for:

\`\`\`
[v0 SERVER] Step X: Description...
\`\`\`

### Check MySQL Logs

XAMPP MySQL logs location:
- Windows: `C:\xampp\mysql\data\mysql_error.log`
- Mac: `/Applications/XAMPP/xamppfiles/logs/mysql_error.log`

### Test Database Manually

\`\`\`bash
# Connect to MySQL
mysql -u root -p

# Select database
USE karkey;

# Check tables
SHOW TABLES;

# Check users table structure
DESCRIBE users;

# Check if user was created
SELECT * FROM users ORDER BY created_at DESC LIMIT 1;
\`\`\`

## Getting Help

If you're still experiencing issues:

1. Run the debug page: `http://localhost:3000/debug`
2. Copy all test results
3. Check browser console for errors
4. Check terminal for server errors
5. Include all error messages when asking for help

## Checklist

Before reporting an issue, verify:

- [ ] XAMPP MySQL is running
- [ ] `.env.local` has correct credentials
- [ ] Database and tables exist (`npm run db:setup`)
- [ ] Debug page shows all tests passing
- [ ] Browser console shows no errors
- [ ] Terminal shows no errors
- [ ] Files are correct format and size
- [ ] All form fields are valid

## Success Indicators

Registration is working correctly when:

1. ✅ Debug page shows all tests passing
2. ✅ Registration form validates inputs in real-time
3. ✅ Image uploads show preview thumbnails
4. ✅ Console shows all steps completing successfully
5. ✅ User is redirected after registration
6. ✅ Database has new user and verification records
