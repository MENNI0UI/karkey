# Database Migration & Auction Creation - Summary

## What Was Done

### 1. Database Schema Update (ERD Implementation)
Added all missing tables from your ERD diagram to match the complete auction platform schema.

**New Tables Created:**
- `bids` - Store all bids placed on auctions
- `plans` - Subscription plans for users
- `subscriptions` - User subscription records
- `deposits` - Buyer/seller deposits for auctions
- `invoices` - Billing invoices
- `payments` - Payment records
- `inspections` - Vehicle inspection requests
- `requests` - General user requests (verification, support, etc.)
- `blacklists` - Blacklisted users

**Migration Files:**
- `scripts/003-add-erd-tables.sql` - Incremental migration
- `backend/src/database/schema.sql` - Updated full schema

### 2. Auction Creation Validation
Enforced all required vehicle fields for approved users creating auctions.

**Required Fields:**
- `make` (string, max 100 chars)
- `model` (string, max 100 chars)
- `year` (number, 1900-2026)
- `mileage` (number, >= 0)
- `transmission` (enum: manual|automatic)
- `fuel_type` (enum: gasoline|diesel|electric|hybrid)
- `vehicle_condition` (enum: excellent|good|fair|poor)
- `location` (string, max 255 chars)
- `description` (string, 20-5000 chars)
- `carte_grise_url` (string, required)
- `service_history_url` (string, optional)
- `photos` (array, min 1, max 10 photos)
- `starting_price` (number, > 0)
- `duration_days` (number, 1-30)

**Validation Functions Added:**
- `validateVehicleData()` in `lib/validations.ts`
- `validateAuctionData()` in `lib/validations.ts`

### 3. Server Actions & API
Updated the auction creation flow to enforce all validations.

**Files Modified:**
- `app/auction/create/actions.ts` - Added validation, transaction support
- `app/api/auctions/create/route.ts` - New API endpoint with auth check
- `lib/types.ts` - Added TypeScript interfaces for all new tables

**Security Checks:**
1. Verify user authentication (JWT token)
2. Check user verification status (must be "approved")
3. Validate all vehicle fields
4. Use database transactions for data integrity
5. Create notification on success

### 4. Testing
Created comprehensive test script to verify the implementation.

**Test Script:** `scripts/test-auction-creation.js`

**Tests Performed:**
✓ Find/create approved user
✓ Insert vehicle with all required fields
✓ Insert multiple vehicle photos with position ordering
✓ Create auction with proper foreign keys
✓ Verify JOIN relationships (auction → vehicle → user → photos)
✓ Test constraint validation (negative mileage rejected)

## How to Use

### Run Migration (PowerShell)
```powershell
# Option 1: Direct migration runner
node .\scripts\run-migration.js

# Option 2: Full schema setup
node .\backend\scripts\setup.js

# Verify tables
node .\scripts\check-tables.js
```

### Test Auction Creation
```powershell
node .\scripts\test-auction-creation.js
```

### Create Auction via API
```bash
POST /api/auctions/create
Headers: Cookie: auth_token=<jwt_token>
Body: {
  "make": "Toyota",
  "model": "Corolla",
  "year": 2020,
  "mileage": 50000,
  "transmission": "automatic",
  "fuel_type": "gasoline",
  "vehicle_condition": "good",
  "location": "Casablanca",
  "description": "Well-maintained vehicle...",
  "carte_grise_url": "/uploads/carte-grise.jpg",
  "service_history_url": "/uploads/history.pdf",
  "photos": ["/uploads/photo1.jpg", "/uploads/photo2.jpg"],
  "starting_price": 80000,
  "reserve_price": 90000,
  "duration_days": 14
}
```

**Response:**
```json
{
  "success": true,
  "vehicleId": 28
}
```

## Database Schema Summary

### Relationships
- `vehicles.user_id` → `users.id` (seller)
- `vehicle_photos.vehicle_id` → `vehicles.id`
- `auctions.vehicle_id` → `vehicles.id`
- `auctions.user_id` → `users.id` (seller)
- `auctions.winner_id` → `users.id` (buyer)
- `bids.auction_id` → `auctions.id`
- `bids.user_id` → `users.id` (bidder)
- `deposits.user_id` → `users.id`
- `deposits.auction_id` → `auctions.id`
- `invoices.user_id` → `users.id`
- `payments.user_id` → `users.id`
- `payments.invoice_id` → `invoices.id`
- `subscriptions.user_id` → `users.id`
- `subscriptions.plan_id` → `plans.id`
- `inspections.vehicle_id` → `vehicles.id`
- `requests.user_id` → `users.id`
- `blacklists.user_id` → `users.id`
- `blacklists.admin_id` → `admins.id`

### Constraints
- Year: 1900 ≤ year ≤ current_year + 1
- Mileage: >= 0
- Starting price: > 0
- Reserve price: >= starting_price (if set)
- Duration: 1-30 days
- Photos: 1-10 required

## Next Steps (Optional)

### Additional Features to Implement:
1. **Bid Placement** - API endpoint to place bids with validation
2. **Deposit Management** - Record and track buyer/seller deposits
3. **Invoice Generation** - Auto-generate invoices for completed auctions
4. **Subscription Plans** - Implement plan limits and features
5. **Admin Dashboard** - Manage requests, inspections, blacklists

### Recommended Enhancements:
- Add photo upload endpoint with size/type validation
- Implement auction status scheduler (pending → active → completed)
- Add real-time bid notifications via WebSocket
- Create admin approval workflow for pending auctions
- Add vehicle search with filters on bids/auction status

## Files Changed

**New Files:**
- `scripts/003-add-erd-tables.sql`
- `scripts/run-migration.js`
- `scripts/test-auction-creation.js`
- `app/api/auctions/create/route.ts`

**Modified Files:**
- `lib/validations.ts` (added vehicle & auction validation)
- `lib/types.ts` (added interfaces for all new tables)
- `lib/migrations.ts` (added 003 migration to runner)
- `backend/src/database/schema.sql` (added new tables)
- `app/auction/create/actions.ts` (improved validation & transactions)

## Rollback Instructions

If you need to rollback the database changes:

```sql
-- Connect to MySQL
USE karkey;

-- Drop new tables (in reverse order due to FKs)
DROP TABLE IF EXISTS blacklists;
DROP TABLE IF EXISTS requests;
DROP TABLE IF EXISTS inspections;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS invoices;
DROP TABLE IF EXISTS deposits;
DROP TABLE IF EXISTS subscriptions;
DROP TABLE IF EXISTS plans;
DROP TABLE IF EXISTS bids;

-- Optionally remove migration record
DELETE FROM _migrations WHERE name = '003-add-erd-tables.sql';
```

## Support

For issues or questions:
1. Check `TROUBLESHOOTING.md`
2. Run `node .\scripts\check-tables.js` to verify table status
3. Check server logs for detailed error messages
4. Verify `.env` has correct DB credentials
