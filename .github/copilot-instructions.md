# Copilot Instructions for Karkey

## Architecture
**Next.js 15 App Router** Moroccan vehicle marketplace with three listing types: **auctions**, **direct sales**, and **showroom (karkey-cars)**. MySQL via Prisma ORM.

```
app/[lang]/              ← Locale-prefixed routes (en/fr/ar/es); Arabic triggers RTL
app/actions/             ← Server actions: vehicles.ts, direct-sales.ts, auctions.ts, filters.ts
app/actions/utils/       ← dbQueryWithTimeout, cache, mappers (NO "use server" - helper files)
app/api/                 ← REST endpoints: uploads, auth, cron, admin
lib/search/              ← search-dictionary.ts = multilingual search terms source
components/wizard/steps/ ← Multi-step form: step-car-details, step-photos, step-pricing, etc.
```

## Server Actions Patterns

### Mutations (e.g., `direct-sales.ts`)
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

### Queries (e.g., `vehicles.ts`, `filters.ts`) - use `dbQueryWithTimeout`
```typescript
"use server"
import { dbQueryWithTimeout } from "./utils";
import { unstable_cache, cacheTag } from "next/cache";

export async function getFilterOptions() {
  "use cache";
  cacheTag("filters", "vehicles");
  
  const data = await dbQueryWithTimeout(
    prisma.direct_sales.findMany({ where: {...} }),
    5000
  );
  return data;
}
```

**Key patterns:**
- `parseOrThrow()` with Zod schemas from `lib/schemas.ts`
- `getCurrentUser()` from `lib/mysql-auth.ts` for auth
- `revalidateTag()` after mutations: `direct-sales`, `auctions`, `vehicles`, `filters`, `karkey-cars`
- Query actions use `"use cache"` + `cacheTag()` (Next.js 15+)

## API Routes - Error Handling
```typescript
import { errorResponse } from "@/lib/errors";

export async function GET() {
  try {
    // ...
  } catch (err) {
    return NextResponse.json(errorResponse(err), { status: 500 });
  }
}
```

## Multilingual Search
`lib/search/search-dictionary.ts` = single source for searchable terms (4 languages + Moroccan dialects).

```typescript
// Adding a new fuel type:
FUEL_DICTIONARY: {
  hydrogen: ['hydrogen', 'hydrogène', 'هيدروجين', 'hidrógeno', ...]
}
// vehicles.ts uses getUnifiedSearchMatches() automatically
```

## i18n Pattern
```tsx
import { useTranslation } from "@/lib/i18n-context";
const { t, dir, language } = useTranslation();
<div dir={dir}>{t("home.title")}</div>

// Update ALL 4 files: lib/locales/{en,fr,ar,es}.ts
```

## File Uploads
Use API route `POST /api/upload` + `useImageUpload()` hook:
```tsx
import { useImageUpload } from "@/hooks/use-image-upload";
const { upload, waitForAll } = useImageUpload({ watermark: true });
```
Client compresses → `/api/upload` → R2/S3. Never upload in server actions.

## Auctions
Created via **Direct Sales with `auction_consent: true`**. Standalone auction creation is deprecated.
See `components/wizard/steps/step-pricing.tsx` for consent toggle.

## Developer Commands
```powershell
npm run dev           # Turbo dev server
npm run db:setup      # Create MySQL tables
npm run db:reset      # Drop & recreate tables
npm run admin:create  # Create admin interactively
npm test              # Vitest
```

## Component Patterns
| Pattern | Files | Notes |
|---------|-------|-------|
| Cards | `*-card.tsx` | direct-sale-card, auction-card, karkey-car-card |
| Filters | `*-filters-sidebar.tsx` | Sync with `app/actions/filters.ts` |
| Wizard Steps | `components/wizard/steps/step-*.tsx` | Props: `{ data, update, t, errors }` |
| Draft Persistence | `useLocalStorage` | In `create-direct-sale-wizard.tsx` |
| UI primitives | `components/ui/*` | shadcn/Radix only |

## Middleware
`middleware.ts` handles:
- Locale detection & redirects (en/fr/ar/es)
- CSP headers with nonce
- Rate limiting for API routes (100 req/min)
- Saved search redirects from cookies

## Security Tools
Located in `security-tools/`:
```powershell
# Scan for leaked secrets in git history
.\security-tools\gitleaks.exe detect --source .

# Scan for vulnerabilities in dependencies
.\security-tools\trivy.exe fs . --scanners vuln
```

## Adding Features Checklist
- [ ] **New filter**: sidebar + `app/actions/vehicles.ts` + search-dictionary
- [ ] **New translation**: ALL 4 files `lib/locales/{en,fr,ar,es}.ts`
- [ ] **DB change**: `prisma/schema.prisma` → `npx prisma generate && npx prisma db push`
- [ ] **New API route**: `app/api/[domain]/route.ts` + `errorResponse()` for errors
