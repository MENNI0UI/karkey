/**
 * AI Tools for Karkey Chatbot
 * 
 * Provides vehicle search functionality for the chatbot.
 */

import prisma from '@/lib/prisma';

// Vehicle search result type for chat
export interface ChatVehicle {
    id: number;
    type: 'direct_sale' | 'auction' | 'karkey';
    make: string;
    model: string;
    year: number;
    price: number;
    mileage: number;
    location: string;
    fuel_type: string;
    transmission: string;
    condition: string;
    engine_size: string;
    photo: string | null;
    url: string;
    created_at?: string;
}

interface SearchParams {
    make?: string;
    model?: string;
    minPrice?: number;
    maxPrice?: number;
    location?: string;
    fuelType?: string;
    transmission?: string;
    minYear?: number;
    maxYear?: number;
    maxEngineSize?: number;
    minEngineSize?: number;
    maxMileage?: number;
    minMileage?: number;
    doors?: string;
    exteriorColor?: string;
    vehicleCondition?: string;
    listingType?: 'sale' | 'auction' | 'karkey' | 'all';
    limit?: number;
    sortBy?: 'price' | 'year' | 'mileage' | 'created_at';
    sortOrder?: 'asc' | 'desc';
}

// In-memory cache for search results to reduce DB load
const searchCache = new Map<string, {
    data: any;
    timestamp: number;
}>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Builds common WHERE conditions for vehicle search
 */
function buildConditions(params: SearchParams, tableAlias: string = 'ds'): string[] {
    const conditions: string[] = [];

    if (params.make && params.make.trim()) {
        const make = params.make.trim().replace(/'/g, "''");
        conditions.push(`LOWER(${tableAlias}.make) LIKE LOWER('%${make}%')`);
    }
    if (params.model && params.model.trim()) {
        const model = params.model.trim().replace(/'/g, "''");
        conditions.push(`LOWER(${tableAlias}.model) LIKE LOWER('%${model}%')`);
    }
    if (params.minPrice) conditions.push(`${tableAlias}.price >= ${params.minPrice}`);
    if (params.maxPrice) conditions.push(`${tableAlias}.price <= ${params.maxPrice}`);
    if (params.location && params.location.trim()) {
        const location = params.location.trim().replace(/'/g, "''");
        conditions.push(`LOWER(${tableAlias}.location) LIKE LOWER('%${location}%')`);
    }
    if (params.fuelType) conditions.push(`LOWER(${tableAlias}.fuel_type) = LOWER('${params.fuelType.trim()}')`);
    if (params.transmission) conditions.push(`LOWER(${tableAlias}.transmission) = LOWER('${params.transmission.trim()}')`);
    if (params.minYear) conditions.push(`${tableAlias}.year >= ${params.minYear}`);
    if (params.maxYear) conditions.push(`${tableAlias}.year <= ${params.maxYear}`);

    // Engine size
    if (params.maxEngineSize) {
        conditions.push(`CAST(REGEXP_SUBSTR(${tableAlias}.engine_size, '[0-9.]+') AS DECIMAL(3,1)) <= ${params.maxEngineSize}`);
    }
    if (params.minEngineSize) {
        conditions.push(`CAST(REGEXP_SUBSTR(${tableAlias}.engine_size, '[0-9.]+') AS DECIMAL(3,1)) >= ${params.minEngineSize}`);
    }

    // Mileage
    if (params.maxMileage) conditions.push(`${tableAlias}.mileage <= ${params.maxMileage}`);
    if (params.minMileage) conditions.push(`${tableAlias}.mileage >= ${params.minMileage}`);

    // Doors
    if (params.doors) conditions.push(`${tableAlias}.doors = '${params.doors.trim().replace(/'/g, "''")}'`);

    // Color
    if (params.exteriorColor) {
        const color = params.exteriorColor.trim().replace(/'/g, "''");
        conditions.push(`LOWER(${tableAlias}.exterior_color) LIKE LOWER('%${color}%')`);
    }

    // Condition
    if (params.vehicleCondition) {
        const cond = params.vehicleCondition.trim().replace(/'/g, "''");
        conditions.push(`LOWER(${tableAlias}.vehicle_condition) = LOWER('${cond}')`);
    }

    return conditions;
}

/**
 * Unified search for vehicles across all sources (Direct Sales, Auctions, Karkey Cars)
 */
export async function searchVehicles(params: SearchParams): Promise<{ success: boolean; count: number; vehicles: ChatVehicle[]; message: string }> {
    try {
        const cacheKey = JSON.stringify(params);
        const cached = searchCache.get(cacheKey);

        if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
            console.log('[Search] Returning cached results for:', cacheKey);
            return cached.data;
        }

        const listingType = params.listingType || 'all';
        const limit = Math.min(params.limit || 16, 20);
        const sortBy = ['price', 'year', 'mileage', 'created_at'].includes(params.sortBy || '') ? params.sortBy : 'created_at';
        const sortOrder = (params.sortOrder?.toLowerCase() === 'asc') ? 'ASC' : 'DESC';

        const tasks: Promise<{ count: number; vehicles: ChatVehicle[] }>[] = [];

        // 1. Search in direct_sales (Sales & Auctions)
        if (listingType === 'all' || listingType === 'sale' || listingType === 'auction') {
            tasks.push((async () => {
                const dsConditions = buildConditions(params, 'ds');
                dsConditions.push("ds.verification_status = 'approved'");
                dsConditions.push("ds.sale_status = 'available'");

                if (listingType === 'sale') dsConditions.push("ds.auction_mode = false");
                else if (listingType === 'auction') dsConditions.push("ds.auction_mode = true");

                const where = dsConditions.join(' AND ');
                const countResult = await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) as total FROM direct_sales ds WHERE ${where}`);
                const total = Number(countResult[0]?.total || 0);

                if (total === 0) return { count: 0, vehicles: [] };

                const results = await prisma.$queryRawUnsafe<any[]>(`
                    SELECT ds.*, (SELECT photo_url FROM direct_sale_photos WHERE direct_sale_id = ds.id ORDER BY position_order ASC LIMIT 1) as photo
                    FROM direct_sales ds WHERE ${where} ORDER BY ds.${sortBy} ${sortOrder} LIMIT ${limit}
                `);

                return {
                    count: total,
                    vehicles: results.map(v => ({
                        id: v.id,
                        type: v.auction_mode ? 'auction' : 'direct_sale',
                        make: v.make || '',
                        model: v.model || '',
                        year: v.year || 0,
                        price: Number(v.price) || 0,
                        mileage: v.mileage || 0,
                        location: v.location || '',
                        fuel_type: v.fuel_type || '',
                        transmission: v.transmission || '',
                        condition: v.vehicle_condition || '',
                        engine_size: v.engine_size || '',
                        photo: v.photo,
                        url: `/direct-sales/${v.id}`,
                        created_at: v.created_at ? new Date(v.created_at).toISOString() : undefined
                    }))
                };
            })());
        }

        // 2. Search in karkey_cars
        if (listingType === 'all' || listingType === 'karkey') {
            tasks.push((async () => {
                const kcConditions = buildConditions(params, 'kc');
                kcConditions.push("kc.is_active = true");

                const where = kcConditions.join(' AND ');
                const countResult = await prisma.$queryRawUnsafe<any[]>(`SELECT COUNT(*) as total FROM karkey_cars kc WHERE ${where}`);
                const total = Number(countResult[0]?.total || 0);

                if (total === 0) return { count: 0, vehicles: [] };

                const results = await prisma.$queryRawUnsafe<any[]>(`
                    SELECT kc.*, (SELECT photo_url FROM karkey_car_photos WHERE karkey_car_id = kc.id ORDER BY position_order ASC LIMIT 1) as photo
                    FROM karkey_cars kc WHERE ${where} ORDER BY kc.${sortBy} ${sortOrder} LIMIT ${limit}
                `);

                return {
                    count: total,
                    vehicles: results.map(v => ({
                        id: v.id,
                        type: 'karkey',
                        make: v.make || '',
                        model: v.model || '',
                        year: v.year || 0,
                        price: Number(v.price) || 0,
                        mileage: v.mileage || 0,
                        location: v.location || '',
                        fuel_type: v.fuel_type || '',
                        transmission: v.transmission || '',
                        condition: v.vehicle_condition || '',
                        engine_size: v.engine_size || '',
                        photo: v.photo,
                        url: `/karkey-cars/${v.id}`,
                        created_at: v.created_at ? new Date(v.created_at).toISOString() : undefined
                    }))
                };
            })());
        }

        const taskResults = await Promise.all(tasks);

        // Merge and sort results if searching multiple sources
        let combinedVehicles = taskResults.flatMap(r => r.vehicles);
        const totalCount = taskResults.reduce((acc, r) => acc + r.count, 0);

        if (listingType === 'all' && taskResults.length > 1) {
            // Sort merged results by the requested field
            combinedVehicles.sort((a, b) => {
                const valA = a[sortBy as keyof ChatVehicle];
                const valB = b[sortBy as keyof ChatVehicle];

                if (typeof valA === 'number' && typeof valB === 'number') {
                    return sortOrder === 'ASC' ? valA - valB : valB - valA;
                }
                if (sortBy === 'created_at' && typeof valA === 'string' && typeof valB === 'string') {
                    return sortOrder === 'ASC'
                        ? new Date(valA).getTime() - new Date(valB).getTime()
                        : new Date(valB).getTime() - new Date(valA).getTime();
                }
                return 0;
            });
            combinedVehicles = combinedVehicles.slice(0, limit);
        }

        const response = {
            success: true,
            count: totalCount,
            vehicles: combinedVehicles,
            message: totalCount > 0
                ? `Found ${totalCount} vehicle(s) matching your criteria.`
                : 'No vehicles found matching your criteria. Try adjusting your search.',
        };

        searchCache.set(cacheKey, { data: response, timestamp: Date.now() });
        return response;

    } catch (error) {
        console.error('[Search Tool Error]', error);
        return {
            success: false,
            count: 0,
            vehicles: [],
            message: 'Sorry, there was an error searching for vehicles.'
        };
    }
}
