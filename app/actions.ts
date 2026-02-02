import { cookies } from "next/headers";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { verifyToken } from "@/lib/mysql-auth";
import prisma from "@/lib/prisma";
import path from "path";
import { info, warn, error as logError } from "@/lib/logger";
import { getSearchTermVariants, parseSmartQuery, normalizeSearchFilter, getEnumMatches, formatFTSQuery } from "@/lib/search-utils";
import { createMetricsContext } from "@/lib/metrics";
import { SearchFiltersSchema, PaginationSchema, safeParse } from "@/lib/schemas";
import { errorResponse, normalizeError, ErrorCode } from "@/lib/errors";
import type { SearchResult, FilterOptionsResult } from "../lib/types/filters";
import type { Vehicle } from "../lib/types/vehicle";

/**
 * Shared vehicle mapper to ensure consistency across all actions
 */
function mapVehicle(item: any): any {
  const photos = Array.isArray(item.direct_sale_photos)
    ? item.direct_sale_photos.map((p: any) => normalizePhotoUrl(p.photo_url)).filter(Boolean) as string[]
    : [];

  const seller = item.users_direct_sales_user_idTousers ? {
    id: item.users_direct_sales_user_idTousers.id,
    name: item.users_direct_sales_user_idTousers.username ?? item.users_direct_sales_user_idTousers.first_name ?? null,
    avatar: item.users_direct_sales_user_idTousers.profile_picture ?? null,
    email: item.users_direct_sales_user_idTousers.email ?? null,
  } : null;

  return {
    id: item.id,
    auction_id: item.id, // compatibility
    make: item.make,
    model: item.model,
    year: item.year,
    mileage: item.mileage,
    transmission: item.transmission,
    fuel_type: item.fuel_type,
    vehicle_condition: item.vehicle_condition,
    location: item.location,
    price: item.price ? Number(item.price) : null,
    current_bid: item.auction_current_bid ? Number(item.auction_current_bid) : null,
    starting_price: item.auction_starting_price ? Number(item.auction_starting_price) : null,
    startingPrice: item.auction_starting_price ? Number(item.auction_starting_price) : null,
    auction_start_date: item.auction_start_date ? new Date(item.auction_start_date).toISOString() : null,
    auction_end_date: item.auction_end_date ? new Date(item.auction_end_date).toISOString() : null,
    photos,
    image: photos[0] || null,
    type: item.auction_mode ? "auction" : "direct_sale",
    user_id: item.user_id,
    seller,
    engine_size: item.engine_size ?? null,
    doors: item.doors ?? null,
    created_at: item.created_at,
    description: item.description,
  };
}

// Shared utilities from modularized action helpers
import {
  CACHE_FILES,
  CACHE_TTL_MS,
  readCache,
  readCacheWithTTL,
  writeCache,
  dbQueryWithTimeout,
  DEFAULT_VEHICLE_IMAGE,
  normalizePhotoUrl,
  pickVehicleCondition,
  isAllFilter,
} from "./actions/utils";

// Legacy aliases for backward compatibility
const CACHE_FILE = CACHE_FILES.approvedVehicles;
const FILTER_OPTIONS_CACHE_FILE = CACHE_FILES.filterOptions;
const DIRECT_SALES_FILTER_CACHE_FILE = CACHE_FILES.directSalesFilterOptions;

// Alias for existing usage pattern
const writeCacheFile = writeCache;

/* ---------------- unifiedSearch ---------------- */
export async function unifiedSearch(filters?: {
  q?: string;
  limit?: number;
  type?: "auction" | "direct_sale" | string;
}): Promise<SearchResult<Vehicle>> {
  const filterKey = JSON.stringify(filters || {});

  return await unstable_cache(
    async () => {
      const metrics = createMetricsContext();
      metrics.start("unifiedSearch-total");
      try {
        const q = (filters?.q || "").trim().toLowerCase();
        const limit = filters?.limit || 5;
        const type = filters?.type;
        const qAsNum = Number.parseInt(q, 10);

        const fuelMatches = getEnumMatches(q, "fuel");
        const transMatches = getEnumMatches(q, "transmission");
        const condMatches = getEnumMatches(q, "condition");

        const queryVariants = getSearchTermVariants(q);
        const orClauses: any[] = [];

        // FTS: Format query for boolean mode (suffix *)
        const ftsQuery = formatFTSQuery(q);

        // Prioritize exact/FTS matches
        if (ftsQuery.length > 0) {
          orClauses.push({ make: { search: ftsQuery } });
          orClauses.push({ model: { search: ftsQuery } });
          orClauses.push({ location: { search: ftsQuery } });
          orClauses.push({ description: { search: ftsQuery } }); // Added description
        }

        // Keep simple contains as fallback for very short terms or strict matches if needed,
        // but FTS covers most. merging variants:
        queryVariants.forEach(v => {
          const lowerV = v.toLowerCase();
          // Keep contains for short strings where FTS might ignore?
          // Actually FTS "search" with * is powerful.
          // Let's stick to FTS for main fields to solve the performance issue.
        });

        if (fuelMatches.length > 0) orClauses.push({ fuel_type: { in: fuelMatches } });
        if (transMatches.length > 0) orClauses.push({ transmission: { in: transMatches } });
        if (condMatches.length > 0) orClauses.push({ vehicle_condition: { in: condMatches } });

        if (!Number.isNaN(qAsNum) && qAsNum > 1900 && qAsNum < 2100) {
          orClauses.push({ year: qAsNum });
        }

        const where: any = {
          verification_status: 'approved',
          OR: orClauses
        };

        if (type === 'auction') {
          where.auction_mode = true;
        } else if (type === 'direct_sale') {
          where.AND = [
            ...(where.AND || []),
            { OR: [{ auction_mode: false }, { auction_mode: null }] }
          ];
        }

        const items = await dbQueryWithTimeout(
          prisma.direct_sales.findMany({
            where,
            include: {
              users_direct_sales_user_idTousers: {
                select: { id: true, username: true, first_name: true, profile_picture: true }
              },
              direct_sale_photos: {
                select: { photo_url: true },
                orderBy: { position_order: 'asc' },
                take: 5
              }
            },
            orderBy: { created_at: 'desc' },
            take: limit
          }),
          5000
        );

        const vehicles = items.map(mapVehicle);

        metrics.end("unifiedSearch-total");
        return { success: true, vehicles: JSON.parse(JSON.stringify(vehicles)) };
      } catch (err) {
        logError("unifiedSearch error", err);
        return { success: false, vehicles: [] };
      }
    },
    [`unified-search-v3-${Buffer.from(filterKey).toString('base64').substring(0, 16)}`],
    { revalidate: 60, tags: ["vehicles", "search"] }
  )();
}

export async function searchVehicles(filters?: {
  make?: string | string[];
  model?: string | string[];
  year?: string | string[];
  minPrice?: string;
  maxPrice?: string;
  fuelType?: string | string[];
  fuel?: string | string[];
  transmission?: string | string[];
  location?: string | string[];
  q?: string;
  type?: string;
  minMileage?: string;
  maxMileage?: string;
  minEngine?: string;
  maxEngine?: string;
  doors?: string;
  condition?: string | string[];
  exteriorColor?: string | string[];
  interiorColor?: string | string[];
  originalPaint?: string;
}, page = 1, limit = 50): Promise<SearchResult<Vehicle>> {
  // If it's a simple query (like for suggestions), use unifiedSearch
  // We now check if it's q OR type or both, and no other complex filters
  const keys = Object.keys(filters || {});
  const isSimple = keys.every(k => k === 'q' || k === 'type' || k === 'limit');

  if (filters?.q && isSimple) {
    return unifiedSearch({ q: filters.q, type: filters.type, limit });
  }
  // Redirect to the new auction search which uses direct_sales with auction_mode
  return searchAuctions(filters, page, limit);
}

/* ---------------- searchAuctions (new system) ---------------- */
async function searchAuctions(filters?: any, page = 1, limit = 50): Promise<SearchResult<Vehicle>> {
  const filterKey = JSON.stringify({ ...filters, page, limit });

  return await unstable_cache(
    async () => {
      const metrics = createMetricsContext();
      metrics.start("searchAuctions-total");
      try {
        const safeFilters = filters || {};
        const offset = Math.max(0, (Number(page) - 1) * Number(limit));

        const where: any = {
          verification_status: 'approved'
        };

        // Partitioning: auction_mode depends on 'type' filter
        if (safeFilters.type === 'auction') {
          where.auction_mode = true;
          where.auction_status = 'active';
          where.auction_end_date = { gt: new Date() };
        } else if (safeFilters.type === 'direct_sale') {
          where.auction_mode = false;
        }

        const isAll = (v?: string | string[]) => {
          if (!v) return true;
          if (Array.isArray(v)) return v.length === 0 || (v.length === 1 && String(v[0]).toLowerCase() === "all");
          return String(v).trim() === "" || String(v).toLowerCase() === "all";
        };

        const addInFilter = (field: string, val: string | string[] | undefined, mapFn?: (v: string) => any) => {
          if (isAll(val)) return;
          const arr = Array.isArray(val) ? val : [String(val)];
          const filtered = arr.filter(x => x && String(x).toLowerCase() !== "all");
          if (filtered.length > 0) {
            where[field] = { in: mapFn ? filtered.map(mapFn) : filtered };
          }
        };

        addInFilter('make', normalizeSearchFilter(safeFilters.make));
        addInFilter('model', normalizeSearchFilter(safeFilters.model));
        addInFilter('location', normalizeSearchFilter(safeFilters.location));

        const fuelVal = (safeFilters as any).fuel ?? (safeFilters as any).fuelType;
        if (!isAll(fuelVal)) {
          const normalized = normalizeSearchFilter(fuelVal);
          const arr = Array.isArray(normalized) ? normalized : [String(normalized)];
          const expanded = new Set<string>();
          arr.forEach(f => {
            const lower = f.toLowerCase();
            expanded.add(lower);
            if (lower === "gasoline") expanded.add("petrol");
            if (lower === "petrol") expanded.add("gasoline");
          });
          where.fuel_type = { in: Array.from(expanded) };
        }
        addInFilter('transmission', normalizeSearchFilter(safeFilters.transmission));
        addInFilter('doors', (safeFilters as any).doors);
        addInFilter('year', safeFilters.year, Number);
        addInFilter('vehicle_condition', normalizeSearchFilter((safeFilters as any).condition), (v) => v.toLowerCase());
        addInFilter('exterior_color', (safeFilters as any).exteriorColor, (v) => v.toLowerCase());
        addInFilter('interior_color', (safeFilters as any).interiorColor, (v) => v.toLowerCase());

        const parseNum = (v?: string) => {
          if (!v) return null;
          const n = Number(String(v).replace(/[^\d.-]/g, ""));
          return isNaN(n) ? null : n;
        };

        const minP = parseNum(safeFilters.minPrice);
        const maxP = parseNum(safeFilters.maxPrice);
        if (minP !== null || maxP !== null) {
          where.auction_starting_price = {};
          if (minP !== null) where.auction_starting_price.gte = minP;
          if (maxP !== null) where.auction_starting_price.lte = maxP;
        }

        const minM = parseNum((safeFilters as any).minMileage);
        const maxM = parseNum((safeFilters as any).maxMileage);
        if (minM !== null || maxM !== null) {
          where.mileage = {};
          if (minM !== null) where.mileage.gte = minM;
          if (maxM !== null) where.mileage.lte = maxM;
        }

        if (safeFilters.q && String(safeFilters.q).trim() !== "") {
          const q = String(safeFilters.q).trim().toLowerCase();
          const qAsNum = Number.parseInt(q, 10);
          const fuelMatches = getEnumMatches(q, "fuel");
          const transMatches = getEnumMatches(q, "transmission");
          const condMatches = getEnumMatches(q, "condition");
          const queryVariants = getSearchTermVariants(q);
          const qOR: any[] = [];

          // FTS Logic for Auctions
          const ftsQuery = formatFTSQuery(q);

          if (ftsQuery.length > 0) {
            qOR.push({ make: { search: ftsQuery } });
            qOR.push({ model: { search: ftsQuery } });
            qOR.push({ location: { search: ftsQuery } });
            qOR.push({ description: { search: ftsQuery } });
          }

          if (fuelMatches.length > 0) qOR.push({ fuel_type: { in: fuelMatches } });
          if (transMatches.length > 0) qOR.push({ transmission: { in: transMatches } });
          if (condMatches.length > 0) qOR.push({ vehicle_condition: { in: condMatches } });
          if (!Number.isNaN(qAsNum) && qAsNum > 1900 && qAsNum < 2100) qOR.push({ year: qAsNum });

          if (where.OR) {
            const existingOR = where.OR;
            delete where.OR;
            where.AND = [{ OR: existingOR }, { OR: qOR }];
          } else {
            where.OR = qOR;
          }
        }

        const take = Math.min(200, Math.max(1, Number(limit)));

        const [totalCount, items] = await dbQueryWithTimeout(
          Promise.all([
            prisma.direct_sales.count({ where }),
            prisma.direct_sales.findMany({
              where,
              include: {
                users_direct_sales_user_idTousers: {
                  select: { id: true, username: true, email: true }
                },
                direct_sale_photos: {
                  select: { photo_url: true },
                  orderBy: { position_order: 'asc' }
                }
              },
              orderBy: { created_at: 'desc' },
              take: take + 1,
              skip: offset
            })
          ]),
          10000
        );

        const hasMore = items.length > take;
        const effectiveItems = items.slice(0, take);

        const vehicles = effectiveItems.map(mapVehicle);

        metrics.end("searchAuctions-total", { count: vehicles.length });
        return {
          success: true,
          vehicles: JSON.parse(JSON.stringify(vehicles)),
          server_time: new Date().toISOString(),
          hasMore,
          total: totalCount,
          page: Number(page),
          limit: Number(limit)
        };
      } catch (err) {
        logError("[app/actions] Error in searchAuctions:", err);
        return { success: false, error: String(err), vehicles: [] };
      }
    },
    [`search-auctions-${Buffer.from(filterKey).toString('base64').substring(0, 16)}`],
    { revalidate: 60, tags: ["auctions", "vehicles"] }
  )();
}

/* ---------------- getApprovedVehicles ---------------- */
// 🆕 النظام الجديد: يستخدم direct_sales مع auction_mode = true
export const getApprovedVehicles = unstable_cache(
  async (limit = 200) => {
    try {
      const limitVal = Number.isSafeInteger(limit) && limit > 0 ? limit : 200;
      const items = await prisma.direct_sales.findMany({
        where: {
          verification_status: 'approved',
          auction_mode: true,
          auction_status: 'active',
          auction_end_date: { gt: new Date() }
        },
        include: {
          users_direct_sales_user_idTousers: {
            select: { id: true, username: true, first_name: true, last_name: true, profile_picture: true }
          },
          direct_sale_photos: {
            select: { photo_url: true },
            orderBy: { position_order: 'asc' }
          }
        },
        orderBy: { created_at: 'desc' },
        take: limitVal
      });

      const enriched = items.map(mapVehicle);
      return { success: true, vehicles: JSON.parse(JSON.stringify(enriched)), server_time: new Date().toISOString() };
    } catch (err) {
      logError("[app/actions] Error in getApprovedVehicles:", err);
      return { success: false, vehicles: [] };
    }
  },
  ["approved-vehicles-v3"],
  { revalidate: 60, tags: ["vehicles", "auctions"] }
);

/* ---------------- getFilterOptions ---------------- */
// 🆕 النظام الجديد: يستخدم direct_sales مع auction_mode = true
export const getFilterOptions = unstable_cache(
  async (): Promise<FilterOptionsResult> => {
    const metrics = createMetricsContext();
    metrics.start("getFilterOptions-db");
    try {
      // Base filter for active auctions
      const baseWhere = {
        verification_status: 'approved' as const,
        auction_mode: true,
        // Removed auction_status: 'active' to show all potential options as per user request
      };

      const standardFuels = ["Petrol", "Diesel", "Hybrid", "Electric"];
      const standardTransmissions = ["Automatic", "Manual"];
      const standardConditions = ["Excellent", "Good", "Fair", "Poor"];
      const majorCities = ["Casablanca", "Rabat", "Marrakech", "Tangier", "Agadir", "Fes", "Oujda", "Kenitra", "Tetouan", "Salé", "Meknès"];

      const mapDbToLabel = (v?: any) => {
        if (!v) return v;
        const s = String(v).trim().toLowerCase();
        if (s === "gasoline" || s === "petrol") return "Petrol";
        if (s === "diesel") return "Diesel";
        if (s === "electric") return "Electric";
        if (s === "hybrid") return "Hybrid";
        return String(v).replace(/^\w/, (c) => c.toUpperCase());
      };

      // Use Promise.all for parallel fetching
      // Use Promise.all for parallel fetching
      // Removing redundant separate queries for makes/models
      const [makeModelData, yearsData, locationsRows, fuelData, transData, condData, makeCountsData, modelCountsData] = await dbQueryWithTimeout(
        Promise.all([
          prisma.direct_sales.findMany({
            where: { verification_status: 'approved', auction_mode: true },
            distinct: ['make', 'model'],
            select: { make: true, model: true },
            orderBy: [{ make: 'asc' }, { model: 'asc' }]
          }),
          prisma.direct_sales.findMany({
            where: { verification_status: 'approved', auction_mode: true },
            distinct: ['year'],
            select: { year: true },
            orderBy: { year: 'desc' }
          }),
          prisma.$queryRaw<Array<{ location: string }>>`
            SELECT DISTINCT TRIM(SUBSTRING_INDEX(location, ',', 1)) AS location 
            FROM direct_sales 
            WHERE verification_status = 'approved' AND auction_mode = 1
            ORDER BY location ASC`,
          prisma.direct_sales.findMany({
            where: { verification_status: 'approved', auction_mode: true },
            distinct: ['fuel_type'],
            select: { fuel_type: true }
          }),
          prisma.direct_sales.findMany({
            where: { verification_status: 'approved', auction_mode: true },
            distinct: ['transmission'],
            select: { transmission: true }
          }),
          prisma.direct_sales.findMany({
            where: { verification_status: 'approved', auction_mode: true },
            distinct: ['vehicle_condition'],
            select: { vehicle_condition: true }
          }),
          // Result Counts for Auctions
          prisma.direct_sales.groupBy({
            by: ['make'],
            where: { verification_status: 'approved', auction_mode: true },
            _count: { id: true }
          }),
          prisma.direct_sales.groupBy({
            by: ['model'],
            where: { verification_status: 'approved', auction_mode: true },
            _count: { id: true }
          })
        ]),
        5000
      );

      // Merge fuel types
      const dbFuels = (fuelData as any[]).map(r => mapDbToLabel(r.fuel_type)).filter(Boolean);
      const fuelOptions = Array.from(new Set([...standardFuels, ...dbFuels])).map(v => ({ value: v.toLowerCase(), label: v }));

      // Merge transmissions
      const dbTrans = (transData as any[]).map(r => mapDbToLabel(r.transmission)).filter(Boolean);
      const transmissionOptions = Array.from(new Set([...standardTransmissions, ...dbTrans]));

      // Merge locations
      const dbLocations = (locationsRows as any[]).map(r => r.location).filter(Boolean);
      const locationOptions = Array.from(new Set([...majorCities, ...dbLocations])).sort();

      // Merge conditions
      const dbConds = (condData as any[]).map(r => mapDbToLabel(r.vehicle_condition)).filter(Boolean);
      const conditionOptions = Array.from(new Set([...standardConditions, ...dbConds])).map(v => ({ value: v.toLowerCase(), label: v }));

      // Derive makes and models from makeModelData to avoid redundant queries
      const makes = Array.from(new Set((makeModelData as any[]).map(r => r.make).filter(Boolean))).sort((a, b) => a.localeCompare(b));
      const models = Array.from(new Set((makeModelData as any[]).map(r => r.model).filter(Boolean))).sort((a, b) => a.localeCompare(b));
      const years = (yearsData as any[]).map(r => String(r.year)).filter(Boolean);

      const makeCounts: Record<string, number> = {};
      (makeCountsData as any[]).forEach(r => { if (r.make) makeCounts[r.make] = r._count.id; });

      const modelCounts: Record<string, number> = {};
      (modelCountsData as any[]).forEach(r => { if (r.model) modelCounts[r.model] = r._count.id; });

      const modelsByMake: Record<string, string[]> = {};
      (makeModelData as any[]).forEach(r => {
        if (!r.make || !r.model) return;
        if (!modelsByMake[r.make]) modelsByMake[r.make] = [];
        if (!modelsByMake[r.make].includes(r.model)) modelsByMake[r.make].push(r.model);
      });
      for (const k of Object.keys(modelsByMake)) modelsByMake[k].sort();

      const result = {
        options: {
          makes,
          models,
          modelsByMake,
          makeCounts,
          modelCounts,
          years,
          locations: locationOptions,
          fuelTypes: fuelOptions,
          transmissions: transmissionOptions,
          conditions: conditionOptions,
        },
      };

      try { await writeCacheFile(FILTER_OPTIONS_CACHE_FILE, result); } catch { }
      metrics.end("getFilterOptions-db");
      return { success: true, ...result, source: "db" };
    } catch (err) {
      metrics.info("getFilterOptions-error", String(err));
      logError("[app/actions] Error in getFilterOptions (attempting fs fallback):", err);
      return { ...errorResponse(err), options: { makes: [], models: [], years: [], locations: [], fuelTypes: [], transmissions: [], conditions: [] } } as any;
    }
  },
  ["auction-filter-options-v2"],
  { revalidate: 3600, tags: ["filters", "vehicles"] }
);


/* ---------------- getDirectSalesFilterOptions ---------------- */
export const getDirectSalesFilterOptions = unstable_cache(
  async (): Promise<FilterOptionsResult> => {
    const metrics = createMetricsContext();
    metrics.start("getDirectSalesFilterOptions-db");
    try {
      // 1. Try reading from cache first
      const cached = await readCacheWithTTL<any>(DIRECT_SALES_FILTER_CACHE_FILE);
      if (cached) {
        return { ...cached, source: 'cache', success: true };
      }

      // Safety: Apply timeout for direct sales filters
      // Removed problematic timeout setting


      const baseWhere: any = {
        verification_status: 'approved',
        sale_status: 'available',
        OR: [
          { auction_mode: false },
          { auction_mode: null }
        ]
      };

      // Use Promise.all to fetch all filter data in parallel for significantly better performance with timeout
      const [
        makeModelData,
        makeYearData, // NEW: combinations for years dependency
        yearsData,
        locationsRows,
        fuelData,
        transData,
        conditionsData,
        priceAgg,
        makeCountsData,
        modelCountsData
      ] = await dbQueryWithTimeout(
        Promise.all([
          prisma.direct_sales.findMany({
            where: baseWhere,
            distinct: ['make', 'model'],
            select: { make: true, model: true },
            orderBy: [{ make: 'asc' }, { model: 'asc' }]
          }),
          prisma.direct_sales.findMany({
            where: baseWhere,
            distinct: ['make', 'year'],
            select: { make: true, year: true },
            orderBy: [{ make: 'asc' }, { year: 'desc' }]
          }),
          prisma.direct_sales.findMany({
            where: baseWhere,
            distinct: ['year'],
            select: { year: true },
            orderBy: { year: 'desc' }
          }),
          // OPTIMIZED LOCATION QUERY: Filtering out sold/auctioned cars
          prisma.$queryRaw<Array<{ location: string }>>`
            SELECT DISTINCT TRIM(SUBSTRING_INDEX(location, ',', 1)) AS location 
            FROM direct_sales 
            WHERE verification_status = 'approved' 
              AND sale_status = 'available'
              AND (auction_mode = 0 OR auction_mode IS NULL)
            ORDER BY location ASC
          `,
          prisma.direct_sales.findMany({
            where: { verification_status: 'approved' },
            distinct: ['fuel_type'],
            select: { fuel_type: true },
            orderBy: { fuel_type: 'asc' }
          }),
          prisma.direct_sales.findMany({
            where: { verification_status: 'approved' },
            distinct: ['transmission'],
            select: { transmission: true },
            orderBy: { transmission: 'asc' }
          }),
          prisma.direct_sales.findMany({
            where: { verification_status: 'approved' },
            distinct: ['vehicle_condition'],
            select: { vehicle_condition: true },
            orderBy: { vehicle_condition: 'asc' }
          }),
          prisma.direct_sales.aggregate({
            where: baseWhere,
            _min: { price: true },
            _max: { price: true }
          }),
          // Result Counts for Direct Sales
          prisma.direct_sales.groupBy({
            by: ['make'],
            where: baseWhere,
            _count: { id: true }
          }),
          prisma.direct_sales.groupBy({
            by: ['model'],
            where: baseWhere,
            _count: { id: true }
          })
        ]),
        10000 // 10s timeout
      );

      const mapDbToLabel = (v?: any) => {
        if (!v) return v;
        const s = String(v).trim().toLowerCase();
        if (s === "gasoline" || s === "petrol") return "Petrol";
        if (s === "diesel") return "Diesel";
        if (s === "electric") return "Electric";
        if (s === "hybrid") return "Hybrid";
        if (s === "automatic") return "Automatic";
        if (s === "manual") return "Manual";
        return String(v).replace(/^\w/, (c) => c.toUpperCase());
      };

      // Standard lists for "Show All" requirement
      const standardFuels = ["Petrol", "Diesel", "Hybrid", "Electric"];
      const standardTransmissions = ["Automatic", "Manual"];
      const standardConditions = ["Excellent", "Good", "Fair", "Poor"];
      const majorCities = ["Casablanca", "Rabat", "Marrakech", "Tangier", "Agadir", "Fes", "Oujda", "Kenitra", "Tetouan", "Salé", "Meknès"];

      // Process Fuels
      const dbFuels = Array.isArray(fuelData) ? fuelData
        .map((r: any) => (r && r.fuel_type ? mapDbToLabel(r.fuel_type) : null))
        .filter((x): x is string => !!x) : [];
      const fuelSet = new Set([...standardFuels, ...dbFuels]);
      const fuelOptions = Array.from(fuelSet).map(v => ({ value: v, label: v }));

      // Process Transmissions
      const dbTrans = Array.isArray(transData) ? transData
        .map((r: any) => (r && r.transmission ? mapDbToLabel(r.transmission) : null))
        .filter((x): x is string => !!x) : [];
      const transSet = new Set([...standardTransmissions, ...dbTrans]);
      const transmissionOptions = Array.from(transSet).sort();

      // Process Locations
      const dbLocations = Array.isArray(locationsRows) ? (locationsRows as any[])
        .map((r) => r.location)
        .filter(Boolean) : [];
      const locationSet = new Set([...majorCities, ...dbLocations]);
      const locationsList = Array.from(locationSet).sort();

      // Process Conditions
      const dbConditions = Array.isArray(conditionsData) ? conditionsData
        .map((r: any) => (r && r.vehicle_condition ? mapDbToLabel(r.vehicle_condition) : null))
        .filter((x): x is string => !!x) : [];
      const conditionSet = new Set([...standardConditions, ...dbConditions]);
      const conditionOptions = Array.from(conditionSet).map(v => ({
        value: v.toLowerCase(),
        label: v
      }));

      const modelsByMake: Record<string, string[]> = {};
      if (Array.isArray(makeModelData)) {
        for (const row of makeModelData) {
          const mk = String(row.make ?? "").trim();
          const md = String(row.model ?? "").trim();
          if (!mk || !md) continue;
          if (!modelsByMake[mk]) modelsByMake[mk] = [];
          if (!modelsByMake[mk].includes(md)) modelsByMake[mk].push(md)
        }
        for (const k of Object.keys(modelsByMake)) modelsByMake[k].sort();
      }

      const yearsByMake: Record<string, string[]> = {};
      if (Array.isArray(makeYearData)) {
        for (const row of makeYearData) {
          const mk = String(row.make ?? "").trim();
          const yr = String(row.year ?? "").trim();
          if (!mk || !yr) continue;
          if (!yearsByMake[mk]) yearsByMake[mk] = [];
          if (!yearsByMake[mk].includes(yr)) yearsByMake[mk].push(yr);
        }
        for (const k of Object.keys(yearsByMake)) {
          yearsByMake[k].sort((a, b) => Number(b) - Number(a));
        }
      }

      const makeCounts: Record<string, number> = {};
      (makeCountsData as any[]).forEach(r => { if (r.make) makeCounts[r.make] = r._count.id; });

      const modelCounts: Record<string, number> = {};
      (modelCountsData as any[]).forEach(r => { if (r.model) modelCounts[r.model] = r._count.id; });

      const result: FilterOptionsResult = {
        success: true,
        source: 'db',
        options: {
          makes: Array.from(new Set((makeModelData as any[]).map(r => r.make).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
          models: Array.from(new Set((makeModelData as any[]).map(r => r.model).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
          modelsByMake,
          yearsByMake,
          makeCounts,
          modelCounts,
          years: (yearsData as any[]).map(r => String(r.year)).filter(Boolean),
          locations: locationsList,
          fuelTypes: fuelOptions,
          transmissions: transmissionOptions,
          conditions: conditionOptions,
          minPrice: Number(priceAgg._min.price) || 0,
          maxPrice: Number(priceAgg._max.price) || 5000000
        }
      };

      // Persistent file cache as backup
      try { await writeCacheFile(DIRECT_SALES_FILTER_CACHE_FILE, result); } catch { }

      metrics.end("getDirectSalesFilterOptions-db");
      return result;
    } catch (err) {
      logError("[app/actions] Error in getDirectSalesFilterOptions:", err);
      return { success: false, options: { makes: [], models: [], years: [], locations: [], fuelTypes: [], transmissions: [], conditions: [], minPrice: 0, maxPrice: 0 } } as any;
    }
  },
  ["direct-sales-filter-options-v2"], // v2 to force cache refresh
  { revalidate: 3600, tags: ["filters", "direct-sales"] }
);

/* ---------------- getApprovedDirectSales ---------------- */
export const getApprovedDirectSales = unstable_cache(
  async (limit = 8) => {
    try {
      const take = typeof limit === 'number' && limit > 0 ? limit : 8;

      // Fetch direct sales with seller info and photos
      const items = await prisma.direct_sales.findMany({
        where: {
          verification_status: 'approved',
          sale_status: 'available'
        },
        include: {
          users_direct_sales_user_idTousers: {
            select: {
              id: true,
              username: true,
              phone_number: true,
              first_name: true,
              last_name: true,
              profile_picture: true,
            }
          },
          direct_sale_photos: {
            select: { photo_url: true },
            orderBy: { position_order: 'asc' }
          }
        },
        orderBy: { created_at: 'desc' },
        take
      })

      const vehicles = items.map(mapVehicle);

      return { success: true, vehicles: JSON.parse(JSON.stringify(vehicles)), server_time: new Date().toISOString() };
    } catch (err) {
      logError("[app/actions] Error in getApprovedDirectSales:", err);
      return { success: false, vehicles: [] };
    }
  },
  ["approved-direct-sales-v3"],
  { revalidate: 300, tags: ["direct-sales", "vehicles"] }
);


/* ---------------- searchDirectSales ---------------- */
export async function searchDirectSales(filters?: any) {
  // Generate a stable cache key based on JSON stringified filters
  const filterKey = JSON.stringify(filters || {});

  return await unstable_cache(
    async () => {
      const metrics = createMetricsContext();
      metrics.start("searchDirectSales-db");
      try {
        const safeFilters = filters || {};
        const where: any = {
          verification_status: 'approved',
          sale_status: 'available',
          OR: [
            { auction_mode: false },
            { auction_mode: null }
          ]
        }

        const isAll = (v?: string | string[]) => {
          if (!v) return true;
          if (Array.isArray(v)) return v.length === 0 || (v.length === 1 && String(v[0]).toLowerCase() === "all");
          return String(v).trim() === "" || String(v).toLowerCase() === "all";
        };

        const addInFilter = (field: string, val: string | string[] | undefined, mapFn?: (v: string) => any) => {
          if (isAll(val)) return;
          const arr = Array.isArray(val) ? val : [String(val)];
          const filtered = arr.filter(x => x && String(x).toLowerCase() !== "all");
          if (filtered.length > 0) {
            where[field] = { in: mapFn ? filtered.map(mapFn) : filtered };
          }
        };

        addInFilter('make', safeFilters.make);
        addInFilter('model', safeFilters.model);
        addInFilter('location', safeFilters.location);

        const fuelVal = safeFilters.fuel_type ?? safeFilters.fuel;
        if (!isAll(fuelVal)) {
          const arr = Array.isArray(fuelVal) ? fuelVal : [String(fuelVal)];
          const expanded = new Set<string>();

          arr.forEach(f => {
            const lower = f.toLowerCase();
            if (lower === "petrol" || lower === "gasoline") {
              expanded.add("gasoline");
            } else {
              expanded.add(lower);
            }
          });
          where.fuel_type = { in: Array.from(expanded) };
        }
        addInFilter('transmission', safeFilters.transmission, (v) => v.toLowerCase());
        addInFilter('doors', safeFilters.doors);
        addInFilter('year', safeFilters.year, Number);

        if (safeFilters.q && String(safeFilters.q).trim() !== "") {
          const q = String(safeFilters.q).trim().toLowerCase();
          const qAsNum = parseInt(q, 10);

          const fuelMatches = Object.entries({
            gasoline: ['gasoline', 'essence', 'petrol', 'بنزين', 'ايصانص', 'gasolina'],
            diesel: ['diesel', 'gazole', 'مازوت', 'ديزل', 'كازوال', 'diésel', 'gasóleo'],
            electric: ['electric', 'electrique', 'كهربائية', 'كهرباء', 'eléctrico'],
            hybrid: ['hybrid', 'hybride', 'هجينة', 'híbrido']
          }).filter(([_, terms]) => terms.some(t => t.includes(q))).map(([k]) => k);

          const transMatches = Object.entries({
            automatic: ['automatic', 'automatique', 'auto', 'أوتوماتيك', 'اوتوماتيك', 'automático'],
            manual: ['manual', 'manuelle', 'boite', 'manuel', 'يدوي', 'مانويل', 'manual']
          }).filter(([_, terms]) => terms.some(t => t.includes(q))).map(([k]) => k);

          const condMatches = Object.entries({
            excellent: ['excellent', 'parfaite', 'neuve', 'ممتازة', 'نظيفة', 'excelente', 'perfecto'],
            good: ['good', 'bonne', 'جيدة', 'bueno'],
            fair: ['fair', 'moyenne', 'متوسطة', 'medio'],
            poor: ['poor', 'mauvaise', 'سيئة', 'malo']
          }).filter(([_, terms]) => terms.some(t => t.includes(q))).map(([k]) => k);

          const qOR: any[] = [
            { make: { contains: q } },
            { model: { contains: q } },
            { location: { contains: q } },
          ];

          if (fuelMatches.length > 0) qOR.push({ fuel_type: { in: fuelMatches } });
          if (transMatches.length > 0) qOR.push({ transmission: { in: transMatches } });
          if (condMatches.length > 0) qOR.push({ vehicle_condition: { in: condMatches } });
          if (!Number.isNaN(qAsNum) && qAsNum > 1900 && qAsNum < 2100) qOR.push({ year: qAsNum });

          if (where.OR) {
            const existingOR = where.OR;
            delete where.OR;
            where.AND = [
              { OR: existingOR },
              { OR: qOR }
            ];
          } else {
            where.OR = qOR;
          }
        }

        const cond = safeFilters.vehicle_condition ?? safeFilters.condition;
        if (cond) addInFilter('vehicle_condition', cond, (v) => v.toLowerCase());

        const extColor = safeFilters.exteriorColor;
        if (extColor) addInFilter('exterior_color', extColor, (v) => v.toLowerCase());

        const intColor = safeFilters.interiorColor;
        if (intColor) addInFilter('interior_color', intColor, (v) => v.toLowerCase());

        const parseNum = (v?: string) => {
          if (!v) return null;
          const n = Number(v);
          return isNaN(n) ? null : n;
        }

        const minP = parseNum(safeFilters.minPrice);
        const maxP = parseNum(safeFilters.maxPrice);
        if (minP !== null || maxP !== null) {
          where.price = {};
          if (minP !== null) where.price.gte = minP;
          if (maxP !== null) where.price.lte = maxP;
        }

        const minM = parseNum(safeFilters.minMileage);
        const maxM = parseNum(safeFilters.maxMileage);
        if (minM !== null || maxM !== null) {
          where.mileage = {};
          if (minM !== null) where.mileage.gte = minM;
          if (maxM !== null) where.mileage.lte = maxM;
        }

        const limitVal = typeof safeFilters.limit === 'number' ? safeFilters.limit : Number(safeFilters.limit) || 20;
        const offsetVal = typeof safeFilters.offset === 'number' ? safeFilters.offset : Number(safeFilters.offset) || 0;
        const take = Math.max(1, Math.min(200, limitVal));
        const skip = Math.max(0, offsetVal);

        const [totalCount, items] = await dbQueryWithTimeout(
          Promise.all([
            prisma.direct_sales.count({ where }),
            prisma.direct_sales.findMany({
              where,
              include: {
                users_direct_sales_user_idTousers: {
                  select: {
                    id: true,
                    username: true,
                    phone_number: true
                  }
                },
                direct_sale_photos: {
                  select: { photo_url: true },
                  orderBy: { position_order: 'asc' }
                }
              },
              orderBy: { created_at: 'desc' },
              take: take + 1,
              skip
            })
          ]),
          10000
        );

        const hasMore = items.length > take;
        const effectiveItems = items.slice(0, take);

        const vehicles = effectiveItems.map(mapVehicle);

        const page = Math.floor(offsetVal / limitVal) + 1;

        metrics.end("searchDirectSales-db");
        return {
          success: true,
          vehicles: JSON.parse(JSON.stringify(vehicles)),
          hasMore,
          total: totalCount,
          page: Number(page),
          limit: Number(limitVal),
          server_time: new Date().toISOString()
        };
      } catch (err) {
        logError("[app/actions] Error in searchDirectSales:", err);
        return { success: false, vehicles: [], error: String(err) };
      }
    },
    [`search-direct-sales-v3-${Buffer.from(filterKey).toString('base64').substring(0, 16)}`],
    { revalidate: 300, tags: ["direct-sales", "vehicles"] }
  )();
}

export const getApprovedKarkeyCars = unstable_cache(
  async (limit = 10) => {
    try {
      const take = typeof limit === 'number' && limit > 0 ? limit : 10;
      const cars = await prisma.karkey_cars.findMany({
        where: { is_active: true },
        include: { photos: { orderBy: { position_order: "asc" } } },
        orderBy: { created_at: "desc" },
        take
      })
      const formattedCars = cars.map(car => ({
        ...car,
        price: car.price ? Number(car.price) : null,
        tax_cost: (car as any).tax_cost ? Number((car as any).tax_cost) : 0,
      }))
      return { success: true, cars: JSON.parse(JSON.stringify(formattedCars)) };
    } catch (err) {
      logError("Error fetching approved Karkey cars:", err);
      return { success: false, cars: [], error: "Failed to fetch cars" };
    }
  },
  ["approved-karkey-cars"],
  { revalidate: 300, tags: ["karkey-cars"] }
);

export const getHomeCitiesData = unstable_cache(
  async () => {
    const cities = ["Casablanca", "Rabat", "Marrakech", "Tangier", "Agadir", "Fes", "Meknes", "Oujda"];
    try {
      // OPTIMIZED: Batch fetch all data in just 2 queries instead of 16 (N+1 fix)
      const [directSalesData, karkeyCarsData] = await Promise.all([
        // Get latest direct sale per city in one query
        prisma.direct_sales.findMany({
          where: {
            verification_status: "approved" as const,
            location: { in: cities.map(c => c) },
          },
          orderBy: { created_at: "desc" },
          include: { direct_sale_photos: { orderBy: { position_order: "asc" }, take: 1 } },
          distinct: ['location'],
        }),
        // Get latest karkey car per city in one query
        prisma.karkey_cars.findMany({
          where: {
            is_active: true,
            location: { in: cities.map(c => c) },
          },
          orderBy: { created_at: "desc" },
          include: { photos: { orderBy: { position_order: "asc" }, take: 1 } },
          distinct: ['location'],
        })
      ]);

      // Create lookup maps for O(1) access
      const directSaleByCity = new Map(
        directSalesData.map(ds => [ds.location?.toLowerCase(), ds])
      );
      const karkeyByCity = new Map(
        karkeyCarsData.map(kc => [kc.location?.toLowerCase(), kc])
      );

      // Build city data using the pre-fetched lookup maps
      const cityData = cities.map(city => {
        const cityLower = city.toLowerCase();
        const latestKarkey = karkeyByCity.get(cityLower);
        const latestDirectSale = directSaleByCity.get(cityLower);

        let cityImage = null;
        if (latestKarkey?.photos?.[0]?.photo_url) {
          cityImage = normalizePhotoUrl(latestKarkey.photos[0].photo_url);
        } else if (latestDirectSale?.direct_sale_photos?.[0]?.photo_url) {
          cityImage = normalizePhotoUrl(latestDirectSale.direct_sale_photos[0].photo_url);
        }

        return {
          city: city,
          name: city,
          image: cityImage || "/zellige.webp",
          count: 0
        };
      });

      return { success: true, cities: JSON.parse(JSON.stringify(cityData)) };
    } catch (err) {
      logError("Error fetching home cities data:", err);
      return { success: false, cities: [] };
    }
  },
  ["home-cities-data"],
  { revalidate: 3600, tags: ["cities", "vehicles", "karkey-cars"] }
);

/* ---------------- searchShowroom ---------------- */
export async function searchShowroom(filters?: {
  make?: string | string[];
  model?: string | string[];
  year?: string | string[];
  minMileage?: string;
  maxMileage?: string;
  minEngine?: string;
  maxEngine?: string;
  doors?: string | string[];
  fuel_type?: string | string[];
  fuel?: string | string[]; // alias
  transmission?: string | string[];
  location?: string | string[];
  condition?: string | string[];
  exteriorColor?: string | string[];
  interiorColor?: string | string[];
  originalPaint?: string;
  limit?: string | number;
  offset?: string | number;
}) {
  return {
    success: true,
    showroom: [],
    hasMore: false,
    total: 0,
    server_time: new Date().toISOString()
  };
}

/* ---------------- getRecentAuctions ---------------- */
// 🆕 النظام الجديد: يستخدم direct_sales مع auction_mode = true
export const getRecentAuctions = unstable_cache(
  async (page = 1, limit = 12) => {
    try {
      const pageNum = Math.max(1, Number(page));
      const limitNum = Math.max(1, Number(limit));
      const offset = (pageNum - 1) * limitNum;

      // Query active auctions from direct_sales with auction_mode = true
      const rows = await prisma.direct_sales.findMany({
        where: {
          verification_status: 'approved',
          auction_mode: true,
          auction_status: 'active',
          auction_end_date: { gt: new Date() }
        },
        include: {
          direct_sale_photos: {
            orderBy: { position_order: 'asc' }
          },
          users_direct_sales_user_idTousers: {
            select: { id: true, username: true, email: true }
          }
        },
        orderBy: { created_at: 'desc' },
        take: limitNum,
        skip: offset
      });

      const normalizeUrl = (raw?: string | null) => {
        if (!raw) return "/assets/images/default-car.png";
        try {
          const s = String(raw).trim();
          if (!s) return "/assets/images/default-car.png";
          if (s.startsWith("http://") || s.startsWith("https://")) return s;
          if (s.startsWith("/")) return s;
          if (s.includes("uploads/vehicles")) return s.startsWith("/") ? s : `/${s}`;
          const base = path.basename(s);
          return base ? `/uploads/vehicles/${base}` : "/assets/images/default-car.png";
        } catch {
          return "/assets/images/default-car.png";
        }
      };

      const auctions = rows.map((r) => {
        const photos = r.direct_sale_photos
          .map(p => normalizeUrl(p.photo_url))
          .filter((url): url is string => url !== null);

        return {
          id: r.id,
          starting_price: r.auction_starting_price ? Number(r.auction_starting_price) : null,
          current_bid: r.auction_current_bid ? Number(r.auction_current_bid) : null,
          vehicle_id: r.id, // In new system, vehicle_id = direct_sale id
          start_date: r.auction_start_date ? new Date(r.auction_start_date).toISOString() : null,
          end_date: r.auction_end_date ? new Date(r.auction_end_date).toISOString() : null,
          created_at: r.created_at,
          // vehicle fields
          make: r.make,
          model: r.model,
          year: r.year,
          mileage: r.mileage,
          transmission: r.transmission,
          fuel_type: r.fuel_type,
          engine_size: r.engine_size ? Number(r.engine_size) : null,
          doors: r.doors,
          vehicle_condition: r.vehicle_condition,
          location: r.location,
          description: r.description,
          carte_grise_url: r.carte_grise_url,
          service_history_url: r.service_history_url,
          vehicle_verification_status: r.verification_status,
          photos,
          title: (r.make || r.model) ? `${r.make ?? ""} ${r.model ?? ""}`.trim() : null,
          seller: r.users_direct_sales_user_idTousers ? {
            id: r.users_direct_sales_user_idTousers.id,
            username: r.users_direct_sales_user_idTousers.username,
            email: r.users_direct_sales_user_idTousers.email,
          } : null,
        };
      });

      return { success: true, auctions };
    } catch (err) {
      logError("getRecentAuctions error", err);
      return { success: false, auctions: [] };
    }
  },
  ["recent-auctions"],
  { revalidate: 60, tags: ["auctions", "vehicles"] }
);

