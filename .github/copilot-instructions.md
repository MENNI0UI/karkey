# Copilot Instructions for Karkey

## Architecture Overview
Karkey is a **Next.js 15 App Router** Moroccan vehicle marketplace with three listing types: **auctions**, **direct sales**, and **showroom**. Data is stored in **MySQL via Prisma ORM**.

### Core Structure
```
app/[lang]/         ← Locale-prefixed routes (en/fr/ar/es); layout handles RTL for Arabic
app/actions.ts      ← Main server actions (searchVehicles, getApprovedVehicles, filters)
app/actions/        ← Domain-specific actions (auctions.ts, direct-sales.ts, showroom.ts)
app/api/            ← REST endpoints for uploads, auth, CRUD, cron jobs
components/         ← Reusable UI: *-card.tsx, *-filters-sidebar.tsx, create-*-wizard.tsx
lib/                ← Core utilities, schemas, auth, storage, translations
```

## Data Layer Patterns

### Prisma as Primary ORM
- Use `prisma` from [lib/prisma.ts](lib/prisma.ts) for all DB access—singleton pattern prevents HMR leaks
- [lib/database.ts](lib/database.ts) provides a legacy `pool` shim routing raw SQL through `prisma.$queryRawUnsafe`
- Prefer Prisma methods (`prisma.vehicles.findMany()`) over raw SQL; use `$queryRawUnsafe` only for complex joins

### Server Actions Pattern
```typescript
// app/actions.ts - always validate with Zod schemas from lib/schemas.ts
const filtersResult = safeParse(SearchFiltersSchema, filters);
if (!filtersResult.success) return { success: false, error: ... };

// Use dbQueryWithTimeout from app/actions/utils for resilient queries
const result = await dbQueryWithTimeout(() => prisma.vehicles.findMany({...}), 5000);
```

### Caching Strategy
- File cache in `os.tmpdir()/karkey-cache/` with 5-minute TTL (see `CACHE_TTL_MS` in [app/actions/utils/cache.ts](app/actions/utils/cache.ts))
- Invalidate via `invalidateCache('approvedVehicles')` when mutations affect search results
- Use `unstable_cache` from Next.js for request-level memoization

## Validation Rules (Morocco-Specific)
From [lib/validations.ts](lib/validations.ts):
- **Phone**: `+212[5-7][0-9]{8}` (Moroccan format)
- **CIN**: `[A-Z]{1,4}[0-9]{1,8}` (national ID)
- **Auctions**: require 5-10 photos, `reserve_price > starting_price`

Input validation uses Zod schemas in [lib/schemas.ts](lib/schemas.ts)—always `safeParse()` in server actions.

## Authentication Flow
- JWT tokens (HS256, 7-day expiry) via [lib/mysql-auth.ts](lib/mysql-auth.ts)
- Cookie names: `auth_token` or `auth:token` (check both for compatibility)
- [middleware.ts](middleware.ts) only guards `/*/create` routes; deeper auth checks happen in server actions
- Use `verifyToken(token)` to extract `{ userId, email }` from JWT

## i18n & Routing
- All user-facing routes under `app/[lang]/` with locales: `en`, `fr`, `ar`, `es`
- Translations in [lib/translations.ts](lib/translations.ts) as `"key.subkey": "value"` maps
- Access via `useI18n()` hook from [lib/i18n-context.tsx](lib/i18n-context.tsx)
- Arabic (`ar`) triggers RTL layout via `dir="rtl"` on `<html>`

## File Upload Pipeline
```
Client → POST /api/upload/* → lib/file-upload.ts → lib/storage.ts → local or S3
```
- Never handle file uploads in server actions directly
- [lib/storage.ts](lib/storage.ts) auto-watermarks images when `WATERMARK_ENABLED=true`
- Normalize URLs via `normalizePhotoUrl()` from `app/actions/utils/helpers.ts`

## Developer Workflow

### Setup
```powershell
npm install
# Copy .env.example → .env.local (see MYSQL-SETUP.md for DB config)
npm run db:setup    # Creates tables
npm run dev         # Starts dev server on localhost:3000
```

### Key Scripts
| Script | Purpose |
|--------|---------|
| `npm run db:reset` | Drop and recreate all tables |
| `npm run admin:create` | Create admin user interactively |
| `npm run cron:complete-auctions` | Close expired auctions (run via scheduler) |
| `npm test` | Run Vitest tests |

### Testing
- Vitest config in [vitest.config.ts](vitest.config.ts) with `@/` alias support
- Tests in `__tests__/` directory; run `npm test`

## Component Conventions

### Reusable Components by Domain
- **Cards**: `auction-card.tsx`, `showroom-card.tsx`, `karkey-car-card.tsx`
- **Filters**: `auction-filters-sidebar.tsx`, `direct-sales-filters-sidebar.tsx`
- **Wizards**: `create-auction-wizard.tsx`, `create-direct-sale-wizard.tsx`

### UI Primitives
All shadcn/Radix components in `components/ui/`—use these for consistency:
```tsx
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
```

## Error Handling
Use structured errors from [lib/errors.ts](lib/errors.ts):
```typescript
import { normalizeError, ErrorCode, errorResponse } from "@/lib/errors";

try { ... } catch (err) {
  const appError = normalizeError(err); // Handles Zod, timeouts, Prisma errors
  return errorResponse(appError.code, appError.message);
}
```

## Adding New Features Checklist
1. **New search filter**: Update both `*-filters-sidebar.tsx` component AND `app/actions.ts` query logic
2. **New API route**: Add to `app/api/[domain]/route.ts`; validate inputs with Zod
3. **New translation**: Add keys to all language objects in [lib/translations.ts](lib/translations.ts)
4. **DB schema change**: Modify `prisma/schema.prisma`, run `npx prisma generate && npx prisma db push`
