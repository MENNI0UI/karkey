# Copilot Instructions for Karkey

## Architecture Overview
**Next.js 15 App Router** Moroccan vehicle marketplace. Three listing types: **auctions**, **direct sales**, **showroom (karkey-cars)**. MySQL via Prisma ORM. 4-language i18n (en/fr/ar/es) with RTL for Arabic.

```
app/[lang]/              ← Locale-prefixed routes; Arabic triggers RTL
app/actions/             ← Server actions: vehicles.ts, direct-sales.ts, auctions.ts, filters.ts
app/actions/utils/       ← Helper utilities (NO "use server"): dbQueryWithTimeout, mappers
app/api/                 ← REST endpoints: /upload, /auth, /cron, /admin
lib/search/              ← search-dictionary.ts = multilingual search terms (SINGLE SOURCE)
lib/schemas.ts           ← Zod schemas for all validation
lib/errors.ts            ← ErrorCode enum + errorResponse() for API routes
components/wizard/steps/ ← Multi-step listing form: step-*.tsx
```

## Server Actions

### Mutations Pattern (`direct-sales.ts`, `auctions.ts`)
```typescript
"use server"
import prisma from "@/lib/prisma";
import { parseOrThrow, CreateDirectSaleSchema } from "@/lib/schemas";
import { getCurrentUser } from "@/lib/mysql-auth";
import { revalidateTag } from "next/cache";

export async function createDirectSale(prevState: any, formData: FormData) {
  const user = await getCurrentUser();
  if (!user?.userId) return { success: false, error: "Unauthorized" };
  
  const data = parseOrThrow(CreateDirectSaleSchema, Object.fromEntries(formData));
  const result = await prisma.direct_sales.create({ data: {...} });
  
  revalidateTag("direct-sales");
  revalidateTag("filters");
  return { success: true, directSaleId: result.id };
}
```

### Query Pattern (`vehicles.ts`, `filters.ts`) - Next.js 15 caching
```typescript
"use server"
import { cacheTag } from "next/cache";
import { dbQueryWithTimeout } from "./utils";

export async function getFilterOptions() {
  "use cache";
  cacheTag("filters", "vehicles");
  
  return dbQueryWithTimeout(
    prisma.direct_sales.findMany({ where: {...} }),
    5000  // 5s timeout prevents hanging
  );
}
```

**Critical patterns:**
- Always use `parseOrThrow()` with Zod schemas from `lib/schemas.ts`
- Auth via `getCurrentUser()` from `lib/mysql-auth.ts` (returns `{ userId, email }` or null)
- Cache tags to revalidate: `direct-sales`, `auctions`, `vehicles`, `filters`, `karkey-cars`
- Queries use `"use cache"` + `cacheTag()` for ISR; `dbQueryWithTimeout()` prevents hangs

### Utils Location - NEVER add "use server"
`app/actions/utils/*.ts` are pure helper functions. Do NOT add `"use server"` directive there—they're imported by server actions, not exposed directly.

## API Routes
```typescript
import { errorResponse, normalizeError } from "@/lib/errors";

export async function GET() {
  try {
    // ... logic
  } catch (err) {
    const appErr = normalizeError(err);  // Handles Zod, timeout, DB errors
    return NextResponse.json(errorResponse(err), { status: 500 });
  }
}
```

## Multilingual Search Dictionary
`lib/search/search-dictionary.ts` defines all searchable terms. `getUnifiedSearchMatches()` in vehicles.ts uses it.

```typescript
// Add new fuel type to FUEL_DICTIONARY:
hydrogen: ['hydrogen', 'hydrogène', 'هيدروجين', 'hidrógeno', /* Moroccan dialect: */ 'ايدروجين']
```

## i18n (4 languages)
```tsx
import { useTranslation } from "@/lib/i18n-context";
const { t, dir, language } = useTranslation();
<div dir={dir}>{t("home.title")}</div>
```
**Always update ALL 4 files:** `lib/locales/{en,fr,ar,es}.ts`

## File Uploads
Client-side compression → API route → R2. **Never upload in server actions.**
```tsx
import { useImageUpload } from "@/hooks/use-image-upload";
const { upload, waitForAll } = useImageUpload({ watermark: true });
```
API validates: origin (CSRF), auth, rate limit, file signature (`lib/file-validation.ts`).

## Auctions
Created via Direct Sales with `auction_consent: true`. Standalone auction creation deprecated.  
See `components/wizard/steps/step-pricing.tsx` for consent toggle.

## Developer Commands
```powershell
npm run dev           # Turbo dev server
npm run db:setup      # Create MySQL tables
npm run db:reset      # Drop & recreate tables
npm run admin:create  # Create admin interactively
npm test              # Vitest (tests in __tests__/)
```

## Security Scanning (Pre-deploy)
```powershell
.\security-tools\scan.ps1        # Fast - daily use (npm audit, gitleaks current, eslint)
.\security-tools\scan.ps1 -Full  # Complete - before deploy (adds trivy, git history scan)
```

## Component Patterns
| Pattern | Example Files | Notes |
|---------|---------------|-------|
| Listing Cards | `direct-sale-card.tsx`, `auction-card.tsx` | Consistent card layout |
| Filter Sidebars | `*-filters-sidebar.tsx` | Sync with `app/actions/filters.ts` |
| Wizard Steps | `components/wizard/steps/step-*.tsx` | Props: `{ data, update, t, errors }` |
| UI Primitives | `components/ui/*` | shadcn/Radix only |

## Adding Features Checklist
- [ ] **New filter:** Update sidebar + `app/actions/vehicles.ts` + `lib/search/search-dictionary.ts`
- [ ] **New translation:** Update ALL 4 files: `lib/locales/{en,fr,ar,es}.ts`
- [ ] **DB schema change:** `prisma/schema.prisma` → `npx prisma generate && npx prisma db push`
- [ ] **New API route:** Use `errorResponse()` for errors; add rate limiting if needed
- [ ] **Before deploy:** Run `.\security-tools\scan.ps1 -Full`
