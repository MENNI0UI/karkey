"use server";

import { unstable_cache, cacheTag } from "next/cache";
import prisma from "@/lib/prisma";
import { error as logError } from "@/lib/logger";
import { createMetricsContext } from "@/lib/metrics";
import { errorResponse } from "@/lib/errors";
import type { FilterOptionsResult } from "@/lib/types/filters";

import {
    CACHE_FILES,
    readCacheWithTTL,
    writeCache,
    dbQueryWithTimeout,
} from "./utils";

// Legacy aliases (or strict types if needed, but imported consts work)
const FILTER_OPTIONS_CACHE_FILE = CACHE_FILES.filterOptions;
const DIRECT_SALES_FILTER_CACHE_FILE = CACHE_FILES.directSalesFilterOptions;

/* ---------------- getFilterOptions ---------------- */
// 🆕 Next.js 16: "use cache" directive
export async function getFilterOptions(): Promise<FilterOptionsResult> {
    "use cache";
    cacheTag("filters", "vehicles", "auction-filter-options");
    // cacheLife("hours"); // Default is usually fine, or configure in next.config.js

    const metrics = createMetricsContext();
    metrics.start("getFilterOptions-db");
    try {
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

        try { await writeCache(FILTER_OPTIONS_CACHE_FILE, result); } catch { }
        metrics.end("getFilterOptions-db");
        return { success: true, ...result, source: "db" };
    } catch (err) {
        metrics.info("getFilterOptions-error", String(err));
        logError("[app/actions] Error in getFilterOptions (attempting fs fallback):", err);
        return { ...errorResponse(err), options: { makes: [], models: [], years: [], locations: [], fuelTypes: [], transmissions: [], conditions: [] } } as any;
    }
}


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
            try { await writeCache(DIRECT_SALES_FILTER_CACHE_FILE, result); } catch { }

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
