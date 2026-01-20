import { cookies } from "next/headers";
import { cache } from "react";
import { unstable_cache } from "next/cache";
import { verifyToken } from "@/lib/mysql-auth";
import prisma from "@/lib/prisma";
import path from "path";
import { info, warn, error as logError } from "@/lib/logger";
import { getSearchTermVariants, parseSmartQuery } from "@/lib/search-utils";
import { createMetricsContext } from "@/lib/metrics";
import { SearchFiltersSchema, PaginationSchema, safeParse } from "@/lib/schemas";
import { errorResponse, normalizeError, ErrorCode } from "@/lib/errors";
import type { SearchResult, FilterOptionsResult } from "../lib/types/filters";
import type { Vehicle } from "../lib/types/vehicle";
// MySQL Event يتولى إنهاء المزادات تلقائياً كل دقيقة - لا حاجة للفحص في الكود

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

/* ---------------- searchVehicles ---------------- */
// 🆕 النظام الجديد: يستخدم direct_sales مع auction_mode = true بدلاً من vehicles/auctions القديمة
// هذه الدالة تستدعي searchAuctions الجديدة للحفاظ على التوافق مع الكود الموجود
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
  // Redirect to the new auction search which uses direct_sales with auction_mode
  return searchAuctions(filters, page, limit);
}

/* ---------------- searchAuctions (new system) ---------------- */
// Search active auctions using direct_sales with auction_mode = true
async function searchAuctions(filters?: {
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
  const metrics = createMetricsContext();
  metrics.start("searchAuctions-total");
  try {
    // MySQL Event يتولى إنهاء المزادات تلقائياً كل دقيقة
    const safeFilters = filters || {};
    const offset = Math.max(0, (Number(page) - 1) * Number(limit));

    const where: any = {
      verification_status: 'approved',
      auction_mode: true,
      auction_status: 'active',
      auction_end_date: { gt: new Date() }
    };

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
    // Fuel handling with Petrol/Gasoline aliasing
    const fuelVal = (safeFilters as any).fuel ?? (safeFilters as any).fuelType;
    if (!isAll(fuelVal)) {
      const arr = Array.isArray(fuelVal) ? fuelVal : [String(fuelVal)];
      const expanded = new Set<string>();
      arr.forEach(f => {
        const lower = f.toLowerCase();
        expanded.add(lower);
        if (lower === "gasoline") expanded.add("petrol");
        if (lower === "petrol") expanded.add("gasoline");
      });
      where.fuel_type = { in: Array.from(expanded) };
    }
    addInFilter('transmission', safeFilters.transmission);
    addInFilter('doors', (safeFilters as any).doors);
    addInFilter('year', safeFilters.year, Number);
    addInFilter('vehicle_condition', (safeFilters as any).condition, (v) => v.toLowerCase());
    addInFilter('exterior_color', (safeFilters as any).exteriorColor, (v) => v.toLowerCase());
    addInFilter('interior_color', (safeFilters as any).interiorColor, (v) => v.toLowerCase());

    const parseNum = (v?: string) => {
      if (!v) return null;
      const n = Number(String(v).replace(/[^\d.-]/g, ""));
      return isNaN(n) ? null : n;
    };

    // Price filter uses auction_starting_price
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

    const minE = parseNum((safeFilters as any).minEngine);
    const maxE = parseNum((safeFilters as any).maxEngine);
    if (minE !== null || maxE !== null) {
      where.engine_size = {};
      if (minE !== null) (where.engine_size as any).gte = String(minE);
      if (maxE !== null) (where.engine_size as any).lte = String(maxE);
    }

    console.log("[DEBUG][searchAuctions] where.engine_size:", JSON.stringify(where.engine_size));
    console.log("[DEBUG][searchAuctions] where types:", {
      gte: typeof (where.engine_size as any)?.gte,
      lte: typeof (where.engine_size as any)?.lte
    });

    if ((safeFilters as any).originalPaint === 'yes') where.is_original_paint = true;
    else if ((safeFilters as any).originalPaint === 'no') where.is_original_paint = false;

    // Free-text search
    if (safeFilters.q && String(safeFilters.q).trim() !== "") {
      const q = String(safeFilters.q).trim().toLowerCase();
      where.OR = [
        { make: { contains: q } },
        { model: { contains: q } },
        { location: { contains: q } },
      ];
    }

    const take = Math.min(200, Math.max(1, Number(limit)));

    const [totalCount, items] = await Promise.all([
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
    ]);

    const hasMore = items.length > take;
    const effectiveItems = items.slice(0, take);

    const vehicles = effectiveItems.map((item) => {
      const photos = item.direct_sale_photos.map(p => normalizePhotoUrl(p.photo_url)).filter(Boolean) as string[];

      return {
        id: item.id,
        auction_id: item.id, // In new system, auction_id = direct_sale id
        make: item.make,
        model: item.model,
        year: item.year,
        mileage: item.mileage,
        transmission: item.transmission,
        fuel_type: item.fuel_type,
        vehicle_condition: item.vehicle_condition,
        location: item.location,
        description: item.description,
        starting_price: item.auction_starting_price ? Number(item.auction_starting_price) : null,
        startingPrice: item.auction_starting_price ? Number(item.auction_starting_price) : null,
        current_bid: item.auction_current_bid ? Number(item.auction_current_bid) : null,
        auction_start_date: item.auction_start_date ? new Date(item.auction_start_date).toISOString() : null,
        auction_end_date: item.auction_end_date ? new Date(item.auction_end_date).toISOString() : null,
        photos,
        image: photos[0] || null,
        seller: item.users_direct_sales_user_idTousers ? {
          id: item.users_direct_sales_user_idTousers.id,
          username: item.users_direct_sales_user_idTousers.username,
          email: item.users_direct_sales_user_idTousers.email,
        } : null,
        engine_size: item.engine_size ? Number(item.engine_size) : null,
        doors: item.doors ? Number(item.doors) : null,
        created_at: item.created_at,
        is_watched: false, // TODO: Add watchlist support for new system
      };
    });

    metrics.end("searchAuctions-total", { count: vehicles.length });
    return {
      success: true,
      vehicles,
      server_time: new Date().toISOString(),
      hasMore,
      total: totalCount,
      page: Number(page),
      limit: Number(limit)
    };
  } catch (err) {
    metrics.info("searchAuctions-error", String(err));
    logError("[app/actions] Error in searchAuctions:", err);
    return { success: false, error: String(err), vehicles: [] };
  }
}

/* ---------------- getApprovedVehicles ---------------- */
// 🆕 النظام الجديد: يستخدم direct_sales مع auction_mode = true
export async function getApprovedVehicles(limit = 200) {
  try {
    const limitVal = Number.isSafeInteger(limit) && limit > 0 ? limit : 200;

    // Query active auctions from direct_sales with auction_mode = true
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

    const enriched = items.map((item) => {
      const photos = item.direct_sale_photos.map(p => normalizePhotoUrl(p.photo_url)).filter(Boolean) as string[];
      const starting_price_num = item.auction_starting_price ? Number(item.auction_starting_price) : null;

      return {
        id: item.id,
        auction_id: item.id, // In new system, auction_id = direct_sale id
        make: item.make,
        model: item.model,
        year: item.year,
        mileage: item.mileage,
        transmission: item.transmission,
        fuel_type: item.fuel_type,
        vehicle_condition: item.vehicle_condition,
        location: item.location,
        description: item.description,
        price: item.price ? Number(item.price) : null,
        starting_price: starting_price_num,
        startingPrice: starting_price_num,
        current_bid: item.auction_current_bid ? Number(item.auction_current_bid) : null,
        auction_start_date: item.auction_start_date ? new Date(item.auction_start_date).toISOString() : null,
        auction_end_date: item.auction_end_date ? new Date(item.auction_end_date).toISOString() : null,
        photos,
        image: photos.length > 0 ? photos[0] : null,
        seller: item.users_direct_sales_user_idTousers ? {
          id: item.users_direct_sales_user_idTousers.id,
          name: item.users_direct_sales_user_idTousers.username ?? item.users_direct_sales_user_idTousers.first_name ?? null,
          avatar: item.users_direct_sales_user_idTousers.profile_picture ?? null,
        } : null,
        engine_size: item.engine_size ? Number(item.engine_size) : null,
        doors: item.doors ? Number(item.doors) : null,
        created_at: item.created_at,
      };
    });

    // cache best-effort
    try {
      await writeCache(enriched as any[]);
    } catch { }


    return JSON.parse(JSON.stringify({ success: true, vehicles: enriched, server_time: new Date().toISOString() }));
  } catch (err) {
    logError("[app/actions] Error in getApprovedVehicles:", err);
    const cached = await readCache();
    if (cached && cached.length) return { success: true, vehicles: cached, source: "cache" };
    return { success: false, vehicles: [] };
  }
}

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
      const [makesData, modelsData, makeModelData, yearsData, locationsRows, fuelData, transData, condData] = await dbQueryWithTimeout(
        Promise.all([
          prisma.direct_sales.findMany({
            where: { verification_status: 'approved', auction_mode: true },
            distinct: ['make'],
            select: { make: true },
            orderBy: { make: 'asc' }
          }),
          prisma.direct_sales.findMany({
            where: { verification_status: 'approved', auction_mode: true },
            distinct: ['model'],
            select: { model: true },
            orderBy: { model: 'asc' }
          }),
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
            WHERE verification_status = 'approved' AND auction_mode = true
            ORDER BY location
            `,
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
          })
        ]),
        15000 // 15s timeout
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

      const modelsByMake: Record<string, string[]> = {};
      if (Array.isArray(makeModelData)) {
        for (const row of makeModelData) {
          const mk = String(row.make ?? "").trim();
          const md = String(row.model ?? "").trim();
          if (!mk || !md) continue;
          if (!modelsByMake[mk]) modelsByMake[mk] = [];
          if (!modelsByMake[mk].includes(md)) modelsByMake[mk].push(md);
        }
        for (const k of Object.keys(modelsByMake)) modelsByMake[k].sort();
      }

      const result = {
        options: {
          makes: makesData.map((r) => r.make),
          models: modelsData.map((r) => r.model),
          modelsByMake,
          years: yearsData.map((r) => String(r.year)),
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
  { revalidate: 300, tags: ["filters", "vehicles"] }
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
        makesData,
        modelsData,
        makeModelData,
        makeYearData, // NEW: combinations for years dependency
        yearsData,
        locationsRows,
        fuelData,
        transData,
        conditionsData,
        priceAgg
      ] = await dbQueryWithTimeout(
        Promise.all([
          prisma.direct_sales.findMany({
            where: baseWhere,
            distinct: ['make'],
            select: { make: true },
            orderBy: { make: 'asc' }
          }),
          prisma.direct_sales.findMany({
            where: baseWhere,
            distinct: ['model'],
            select: { model: true },
            orderBy: { model: 'asc' }
          }),
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
          prisma.$queryRaw<Array<{ location: string }>>`
            SELECT DISTINCT TRIM(SUBSTRING_INDEX(location, ',', 1)) AS location 
            FROM direct_sales 
            WHERE verification_status = 'approved'
            ORDER BY location
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
          if (!yearsByMake[mk].includes(yr)) yearsByMake[mk].push(yr)
        }
        for (const k of Object.keys(yearsByMake)) yearsByMake[k].sort((a, b) => Number(b) - Number(a));
      }

      const result = {
        options: {
          makes: makesData.map((r) => r.make),
          models: modelsData.map((r) => r.model),
          modelsByMake,
          yearsByMake,
          years: yearsData.map((r) => String(r.year)),
          locations: locationsList,
          fuelTypes: fuelOptions,
          transmissions: transmissionOptions,
          conditions: conditionOptions,
          minPrice: Number(priceAgg._min.price) || 0,
          maxPrice: Number(priceAgg._max.price) || 0,
        },
      };

      // Persistent file cache as backup
      try { await writeCacheFile(DIRECT_SALES_FILTER_CACHE_FILE, result); } catch { }

      metrics.end("getDirectSalesFilterOptions-db");
      return { success: true, ...result, source: "db" };
    } catch (err) {
      logError("[app/actions] Error in getDirectSalesFilterOptions:", err);
      return { success: false, options: { makes: [], models: [], years: [], locations: [], fuelTypes: [], transmissions: [], conditions: [], minPrice: 0, maxPrice: 0 } } as any;
    }
  },
  ["direct-sales-filter-options-v2"], // v2 to force cache refresh
  { revalidate: 300, tags: ["filters", "direct-sales"] }
);

/* ---------------- getApprovedDirectSales ---------------- */
export async function getApprovedDirectSales(limit = 8) {
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

    const vehicles = items.map((item) => {
      const photos = item.direct_sale_photos.map(p => {
        const url = p.photo_url;
        if (!url) return null;
        if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/")) return url;
        return `/uploads/vehicles/${path.basename(url)}`;
      }).filter(Boolean) as string[];

      // Add service_history_url to photos if not already present
      if (item.service_history_url) {
        let historyUrl = item.service_history_url;
        if (!(historyUrl.startsWith("http") || historyUrl.startsWith("/"))) {
          historyUrl = `/uploads/vehicles/${path.basename(historyUrl)}`;
        }
        if (!photos.includes(historyUrl)) {
          photos.push(historyUrl);
        }
      }

      return {
        id: item.id,
        user_id: item.user_id,
        make: item.make,
        model: item.model,
        year: item.year,
        mileage: item.mileage,
        vehicle_condition: item.vehicle_condition,
        fuel_type: item.fuel_type,
        engine_size: item.engine_size ? Number(item.engine_size) : null,
        doors: item.doors,
        transmission: item.transmission,
        location: item.location,
        description: item.description,
        price: item.price ? Number(item.price) : null,
        startingPrice: item.price ? Number(item.price) : null, // unified key
        verification_status: item.verification_status,
        sale_status: item.sale_status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        photos,
        image: photos.length > 0 ? photos[0] : null,
        seller: item.users_direct_sales_user_idTousers ? {
          id: item.users_direct_sales_user_idTousers.id,
          username: item.users_direct_sales_user_idTousers.username,
          name: item.users_direct_sales_user_idTousers.first_name || item.users_direct_sales_user_idTousers.username,
          avatar: item.users_direct_sales_user_idTousers.profile_picture,
          phone_number: item.users_direct_sales_user_idTousers.phone_number,
        } : null,
      };
    })

    return { success: true, vehicles, server_time: new Date().toISOString() };
  } catch (err) {
    logError("[app/actions] Error in getApprovedDirectSales:", err);
    return { success: false, vehicles: [] };
  }

}


/* ---------------- searchDirectSales ---------------- */
export async function searchDirectSales(filters?: {
  make?: string | string[];
  model?: string | string[];
  year?: string | string[];
  minPrice?: string;
  maxPrice?: string;
  minMileage?: string;
  maxMileage?: string;
  doors?: string | string[];
  vehicle_condition?: string | string[];
  condition?: string | string[]; // alias
  fuel_type?: string | string[];
  fuel?: string | string[]; // alias
  transmission?: string | string[];
  location?: string | string[];
  exteriorColor?: string | string[];
  interiorColor?: string | string[];
  originalPaint?: string;
  limit?: string | number;
  offset?: string | number;
}) {
  const metrics = createMetricsContext();
  metrics.start("searchDirectSales-db");
  try {
    // MySQL Event يتولى إنهاء المزادات تلقائياً كل دقيقة
    const safeFilters = filters || {};
    const where: any = {
      verification_status: 'approved',
      sale_status: 'available',
      // 🆕 استثناء السيارات التي تحولت للمزاد
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
    // Fuel handling with Petrol/Gasoline aliasing
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
    addInFilter('transmission', safeFilters.transmission);
    addInFilter('doors', safeFilters.doors);
    addInFilter('year', safeFilters.year, Number);

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

    const minE = parseNum((safeFilters as any).minEngine);
    const maxE = parseNum((safeFilters as any).maxEngine);
    if (minE !== null || maxE !== null) {
      where.engine_size = {};
      if (minE !== null) (where.engine_size as any).gte = String(minE);
      if (maxE !== null) (where.engine_size as any).lte = String(maxE);
    }

    console.log("[DEBUG][searchDirectSales] where.engine_size:", JSON.stringify(where.engine_size));
    console.log("[DEBUG][searchDirectSales] where types:", {
      gte: typeof (where.engine_size as any)?.gte,
      lte: typeof (where.engine_size as any)?.lte
    });

    if (safeFilters.originalPaint === 'yes') where.is_original_paint = true;
    else if (safeFilters.originalPaint === 'no') where.is_original_paint = false;

    const limitVal = typeof safeFilters.limit === 'number' ? safeFilters.limit : Number(safeFilters.limit) || 20;
    const offsetVal = typeof safeFilters.offset === 'number' ? safeFilters.offset : Number(safeFilters.offset) || 0;
    const take = Math.max(1, Math.min(200, limitVal));
    const skip = Math.max(0, offsetVal);

    // parallel count + query
    const [totalCount, items] = await Promise.all([
      // count might be slow if large db, but reasonable for now
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
        take: take + 1, // ask for one more to check hasMore
        skip
      })
    ]);

    const hasMore = items.length > take;
    const effectiveItems = items.slice(0, take);

    const vehicles = effectiveItems.map((item) => {
      const photos = item.direct_sale_photos.map(p => normalizePhotoUrl(p.photo_url)).filter(Boolean) as string[];
      if (item.service_history_url) {
        const hUrl = normalizePhotoUrl(item.service_history_url);
        if (hUrl && !photos.includes(hUrl)) photos.push(hUrl);
      }

      return {
        id: item.id,
        user_id: item.user_id,
        make: item.make,
        model: item.model,
        year: item.year,
        mileage: item.mileage,
        vehicle_condition: item.vehicle_condition,
        fuel_type: item.fuel_type,
        engine_size: item.engine_size ? Number(item.engine_size) : null,
        doors: item.doors,
        transmission: item.transmission,
        location: item.location,
        description: item.description,
        price: item.price ? Number(item.price) : null,
        startingPrice: item.price ? Number(item.price) : null,
        verification_status: item.verification_status,
        sale_status: item.sale_status,
        created_at: item.created_at,
        photos,
        image: photos[0] || null,
        seller: item.users_direct_sales_user_idTousers ? {
          id: item.users_direct_sales_user_idTousers.id,
          username: item.users_direct_sales_user_idTousers.username,
          phone_number: item.users_direct_sales_user_idTousers.phone_number
        } : null
      };
    });

    metrics.end("searchDirectSales-db");
    return {
      success: true,
      vehicles,
      hasMore,
      total: totalCount,
      server_time: new Date().toISOString()
    };
  } catch (err) {
    logError("[app/actions] Error in searchDirectSales:", err);
    // fallback to empty
    return { success: false, vehicles: [], error: String(err) };
  }
}

export async function getApprovedKarkeyCars(limit = 10) {
  try {
    const take = typeof limit === 'number' && limit > 0 ? limit : 10;

    // Fetch active Karkey cars
    const cars = await prisma.karkey_cars.findMany({
      where: {
        is_active: true
      },
      include: {
        photos: {
          orderBy: { position_order: "asc" },
        },
      },
      orderBy: { created_at: "desc" },
      take
    })

    const formattedCars = cars.map(car => ({
      ...car,
      price: car.price ? Number(car.price) : null,
      tax_cost: (car as any).tax_cost ? Number((car as any).tax_cost) : 0,
    }))

    // Deep-cleanse any remaining objects (like Date vs string, or missed Decimals)
    return JSON.parse(JSON.stringify({ success: true, cars: formattedCars, server_time: new Date().toISOString() }));
  } catch (err) {
    console.error("Error fetching approved Karkey cars:", err);
    return { success: false, cars: [], error: "Failed to fetch cars" };
  }
}

export async function getHomeCitiesData() {
  const cities = ["Casablanca", "Rabat", "Marrakech", "Tangier", "Agadir", "Fes", "Meknes", "Oujda"];
  const cityData = [];

  try {
    for (const city of cities) {
      // Find latest approved direct_sale (live auction OR standard sale) in this city
      const latestDirectSale = await prisma.direct_sales.findFirst({
        where: {
          location: { contains: city },
          verification_status: "approved" as const,
          // Removed auction_mode: true to allow Showing ANY valid car from the city as cover
        },
        orderBy: { created_at: "desc" },
        include: { direct_sale_photos: { orderBy: { position_order: "asc" }, take: 1 } }
      });

      // Find latest active karkey car in this city
      const latestKarkey = await prisma.karkey_cars.findFirst({
        where: {
          location: { contains: city },
          is_active: true
        },
        orderBy: { created_at: "desc" },
        include: { photos: { orderBy: { position_order: "asc" }, take: 1 } }
      });

      let imageUrl = "/placeholder.svg";

      const directSaleDate = latestDirectSale?.created_at ? new Date(latestDirectSale.created_at).getTime() : 0;
      const karkeyDate = latestKarkey?.created_at ? new Date(latestKarkey.created_at).getTime() : 0;

      if (directSaleDate > 0 || karkeyDate > 0) {
        if (directSaleDate >= karkeyDate && latestDirectSale?.direct_sale_photos?.[0]) {
          imageUrl = normalizePhotoUrl(latestDirectSale.direct_sale_photos[0].photo_url) || "/placeholder.svg";
        } else if (latestKarkey?.photos?.[0]) {
          const photo = latestKarkey.photos[0].photo_url;
          if (photo.startsWith("http") || photo.startsWith("/")) {
            imageUrl = photo;
          } else {
            imageUrl = `/api/uploads/karkey-cars/${photo.split("/").pop()}`;
          }
        }
      }

      cityData.push({ city, image: imageUrl });
    }

    return { success: true, cities: cityData };
  } catch (err) {
    console.error("Error fetching homepage cities data:", err);
    return { success: false, cities: [] };
  }
}

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
  const metrics = createMetricsContext();
  metrics.start("searchShowroom-db");
  try {
    const safeFilters = filters || {};
    const where: any = {}

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
    // Fuel handling with Petrol/Gasoline aliasing
    const fuelVal = safeFilters.fuel_type ?? safeFilters.fuel;
    if (!isAll(fuelVal)) {
      const arr = Array.isArray(fuelVal) ? fuelVal : [String(fuelVal)];
      const expanded = new Set<string>();
      arr.forEach(f => {
        const lower = f.toLowerCase();
        expanded.add(lower);
        if (lower === "gasoline") expanded.add("petrol");
        if (lower === "petrol") expanded.add("gasoline");
      });
      where.fuel_type = { in: Array.from(expanded) };
    }
    addInFilter('transmission', safeFilters.transmission);
    addInFilter('doors', safeFilters.doors, Number);
    addInFilter('year', safeFilters.year, Number);

    const cond = safeFilters.condition;
    if (cond) addInFilter('condition', cond, (v) => v.toLowerCase());

    const extColor = safeFilters.exteriorColor;
    if (extColor) addInFilter('exterior_color', extColor, (v) => v.toLowerCase());

    const intColor = safeFilters.interiorColor;
    if (intColor) addInFilter('interior_color', intColor, (v) => v.toLowerCase());

    const parseNum = (v?: string) => {
      if (!v) return null;
      const n = Number(v);
      return isNaN(n) ? null : n;
    }

    const minM = parseNum(safeFilters.minMileage);
    const maxM = parseNum(safeFilters.maxMileage);
    if (minM !== null || maxM !== null) {
      where.mileage_km = {};
      if (minM !== null) where.mileage_km.gte = minM;
      if (maxM !== null) where.mileage_km.lte = maxM;
    }

    const minE = parseNum(safeFilters.minEngine);
    const maxE = parseNum(safeFilters.maxEngine);
    if (minE !== null || maxE !== null) {
      where.engine_size = {};
      if (minE !== null) where.engine_size.gte = minE;
      if (maxE !== null) where.engine_size.lte = maxE;
    }

    if (safeFilters.originalPaint === 'yes') where.is_original_paint = true;
    else if (safeFilters.originalPaint === 'no') where.is_original_paint = false;

    const limitVal = typeof safeFilters.limit === 'number' ? safeFilters.limit : Number(safeFilters.limit) || 12;
    const offsetVal = typeof safeFilters.offset === 'number' ? safeFilters.offset : Number(safeFilters.offset) || 0;
    const take = Math.max(1, Math.min(200, limitVal));
    const skip = Math.max(0, offsetVal);

    // Check user auth + interests if logged in
    const interestsSet = new Set<number>();


    // parallel count + query
    const [totalCount, items] = await Promise.all([
      prisma.showroom.count({ where }),
      prisma.showroom.findMany({
        where,
        select: {
          id: true,
          user_id: true,
          make: true,
          model: true,
          year: true,
          mileage_km: true,
          condition: true,
          fuel_type: true,
          engine_size: true,
          doors: true,
          transmission: true,
          location: true,
          description: true,
          created_at: true,
          updated_at: true,
          showroom_photos: {
            select: { photo_url: true },
            orderBy: { created_at: 'asc' }
          }
        },
        orderBy: { created_at: 'desc' },
        take: take + 1, // ask for one more to check hasMore
        skip
      })
    ]);

    const hasMore = items.length > take;
    const effectiveItems = items.slice(0, take);

    const safeNumber = (v: any) => {
      if (v === null || v === undefined || v === "") return null
      try {
        if (typeof v === 'object') {
          if (typeof (v as any).toNumber === 'function') return Number((v as any).toNumber())
          if (typeof (v as any).toString === 'function') return Number(String(v))
        }
        return Number(v)
      } catch { return null }
    }

    const formattedItems = effectiveItems.map((r) => ({
      id: Number(r.id),
      user_id: Number(r.user_id),
      make: r.make,
      model: r.model,
      year: safeNumber(r.year),
      mileage_km: safeNumber(r.mileage_km),
      condition: r.condition,
      fuel_type: r.fuel_type,
      engine_size: safeNumber(r.engine_size),
      doors: safeNumber(r.doors),
      transmission: r.transmission,
      location: r.location,
      description: r.description,
      created_at: r.created_at ? new Date(r.created_at).toISOString() : null,
      updated_at: r.updated_at ? new Date(r.updated_at).toISOString() : null,
      photos: r.showroom_photos.map(p => p.photo_url || ""),
      interest_sent: interestsSet.has(Number(r.id))
    }))

    metrics.end("searchShowroom-db");
    return {
      success: true,
      showroom: formattedItems,
      hasMore,
      total: totalCount,
      server_time: new Date().toISOString()
    };
  } catch (err) {
    logError("[app/actions] Error in searchShowroom:", err);
    // fallback to empty
    return { success: false, showroom: [], error: String(err) };
  }
}

/* ---------------- getRecentAuctions ---------------- */
// 🆕 النظام الجديد: يستخدم direct_sales مع auction_mode = true
export async function getRecentAuctions(page = 1, limit = 12) {
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
    console.error("getRecentAuctions error", err);
    return { success: false, auctions: [] };
  }
}

