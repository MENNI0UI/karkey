"use server";

import { unstable_cache, cacheTag } from "next/cache";
import path from "path";
import prisma from "@/lib/prisma";
import { error as logError } from "@/lib/logger";
import { getSearchTermVariants, getEnumMatches, formatFTSQuery, normalizeSearchFilter } from "@/lib/search-utils";
import { createMetricsContext } from "@/lib/metrics";
import type { SearchResult } from "@/lib/types/filters";
import type { Vehicle } from "@/lib/types/vehicle";
import { dbQueryWithTimeout, normalizePhotoUrl } from "./utils";
import { mapVehicle } from "./utils/mappers";

/* ---------------- unifiedSearch ---------------- */
export async function unifiedSearch(filters?: {
    q?: string;
    limit?: number;
    type?: "auction" | "direct_sale" | string;
}): Promise<SearchResult<Vehicle>> {
    "use server";
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
                    orClauses.push({ description: { search: ftsQuery } });
                }

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
                ) as any[];

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
    "use server";
    const keys = Object.keys(filters || {});
    const isSimple = keys.every(k => k === 'q' || k === 'type' || k === 'limit');

    if (filters?.q && isSimple) {
        return unifiedSearch({ q: filters.q, type: filters.type, limit });
    }
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

export async function getApprovedVehicles(limit = 200) {
    "use cache";
    cacheTag("vehicles", "auctions", "approved-vehicles");

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
}

export const getApprovedDirectSales = unstable_cache(
    async (limit = 8) => {
        try {
            const take = typeof limit === 'number' && limit > 0 ? limit : 8;

            // Fetch direct sales with seller info and photos
            const items = await dbQueryWithTimeout(
                prisma.direct_sales.findMany({
                    take,
                    where: {
                        verification_status: 'approved',
                        sale_status: 'available',
                        OR: [
                            { auction_mode: false },
                            { auction_mode: null }
                        ]
                    },
                    orderBy: { created_at: 'desc' },
                    include: {
                        users_direct_sales_user_idTousers: {
                            select: {
                                id: true,
                                username: true,
                                profile_picture: true,
                            },
                        },
                        direct_sale_photos: {
                            take: 1,
                            select: { photo_url: true },
                            orderBy: { position_order: 'asc' }
                        },
                    },
                }),
                5000,
            ) as any[];

            const mappedVehicles = items.map(mapVehicle);

            return { success: true, vehicles: mappedVehicles };
        } catch (err) {
            logError('[app/actions] Error in getApprovedDirectSales:', err);
            return { success: false, vehicles: [] };
        }
    },
    ['approved-direct-sales-v3'],
    { revalidate: 300, tags: ['direct-sales', 'vehicles'] }
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
            const formattedCars = cars.map((car: typeof cars[number]) => ({
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
            type DirectSale = typeof directSalesData[number];
            const directSaleByCity = new Map<string, DirectSale>(
                directSalesData.map((ds: DirectSale) => [ds.location?.toLowerCase() || "", ds])
            );

            type KarkeyCar = typeof karkeyCarsData[number];
            const karkeyByCity = new Map<string, KarkeyCar>(
                karkeyCarsData.map((kc: KarkeyCar) => [kc.location?.toLowerCase() || "", kc])
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
    // Stub for now, can be implemented similar to searchDirectSales if needed
    return {
        success: true,
        showroom: [],
        hasMore: false,
        total: 0,
        server_time: new Date().toISOString()
    };
}

/* ---------------- getRecentAuctions ---------------- */
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

            const auctions = rows.map((r: typeof rows[number]) => {
                const photos = r.direct_sale_photos
                    .map((p: typeof r.direct_sale_photos[0]) => normalizeUrl(p.photo_url))
                    .filter((url: string | null): url is string => url !== null);

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
