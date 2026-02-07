/**
 * AI Tools for Karkey Chatbot
 * 
 * Provides vehicle search functionality for the chatbot.
 */

import prisma from '@/lib/prisma';

// Vehicle search result type for chat
export interface ChatVehicle {
    id: number;
    type: 'direct_sale' | 'auction';
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
    limit?: number;
    sortBy?: 'price' | 'year' | 'mileage' | 'created_at';
    sortOrder?: 'asc' | 'desc';
}

/**
 * Search for vehicles in the database using flexible matching
 */
export async function searchVehicles(params: SearchParams): Promise<{ success: boolean; count: number; vehicles: ChatVehicle[]; message: string }> {
    try {
        console.log('[Search] Input params:', JSON.stringify(params));

        // Build WHERE conditions - only add if value is valid
        const conditions: string[] = [
            "verification_status = 'approved'",
            "sale_status = 'available'"
        ];

        if (params.make && typeof params.make === 'string' && params.make.trim()) {
            const make = params.make.trim().replace(/'/g, "''");
            conditions.push(`LOWER(make) LIKE LOWER('%${make}%')`);
        }
        if (params.model && typeof params.model === 'string' && params.model.trim()) {
            const model = params.model.trim().replace(/'/g, "''");
            conditions.push(`LOWER(model) LIKE LOWER('%${model}%')`);
        }
        if (params.minPrice && typeof params.minPrice === 'number' && params.minPrice > 0) {
            conditions.push(`price >= ${params.minPrice}`);
        }
        if (params.maxPrice && typeof params.maxPrice === 'number' && params.maxPrice > 0) {
            conditions.push(`price <= ${params.maxPrice}`);
        }
        if (params.location && typeof params.location === 'string' && params.location.trim()) {
            const location = params.location.trim().replace(/'/g, "''");
            conditions.push(`LOWER(location) LIKE LOWER('%${location}%')`);
        }
        if (params.fuelType && typeof params.fuelType === 'string' && params.fuelType.trim()) {
            const fuelType = params.fuelType.trim().replace(/'/g, "''");
            conditions.push(`LOWER(fuel_type) = LOWER('${fuelType}')`);
        }
        if (params.transmission && typeof params.transmission === 'string' && params.transmission.trim()) {
            const transmission = params.transmission.trim().replace(/'/g, "''");
            conditions.push(`LOWER(transmission) = LOWER('${transmission}')`);
        }
        if (params.minYear && typeof params.minYear === 'number' && params.minYear > 1900) {
            conditions.push(`year >= ${params.minYear}`);
        }
        if (params.maxYear && typeof params.maxYear === 'number' && params.maxYear > 1900) {
            conditions.push(`year <= ${params.maxYear}`);
        }
        // Engine size filter - simplified REGEXP for robustness (avoiding backslash escaping issues)
        // [0-9.]+ matches "2.2", "2.0", "1.6" etc.
        if (params.maxEngineSize && typeof params.maxEngineSize === 'number' && params.maxEngineSize > 0) {
            console.log('[Search] Filter MaxEngine:', params.maxEngineSize);
            conditions.push(`CAST(REGEXP_SUBSTR(engine_size, '[0-9.]+') AS DECIMAL(3,1)) <= ${params.maxEngineSize}`);
        }
        if (params.minEngineSize && typeof params.minEngineSize === 'number' && params.minEngineSize > 0) {
            console.log('[Search] Filter MinEngine:', params.minEngineSize);
            conditions.push(`CAST(REGEXP_SUBSTR(engine_size, '[0-9.]+') AS DECIMAL(3,1)) >= ${params.minEngineSize}`);
        }
        // Mileage filter
        if (params.maxMileage && typeof params.maxMileage === 'number' && params.maxMileage > 0) {
            conditions.push(`mileage <= ${params.maxMileage}`);
        }
        if (params.minMileage && typeof params.minMileage === 'number' && params.minMileage >= 0) {
            conditions.push(`mileage >= ${params.minMileage}`);
        }
        // Doors filter
        if (params.doors && typeof params.doors === 'string' && params.doors.trim()) {
            const doors = params.doors.trim().replace(/'/g, "''");
            conditions.push(`doors = '${doors}'`);
        }
        // Exterior color filter
        if (params.exteriorColor && typeof params.exteriorColor === 'string' && params.exteriorColor.trim()) {
            const color = params.exteriorColor.trim().replace(/'/g, "''");
            conditions.push(`LOWER(exterior_color) LIKE LOWER('%${color}%')`);
        }
        // Vehicle condition filter
        if (params.vehicleCondition && typeof params.vehicleCondition === 'string' && params.vehicleCondition.trim()) {
            const condition = params.vehicleCondition.trim().replace(/'/g, "''");
            conditions.push(`LOWER(vehicle_condition) = LOWER('${condition}')`);
        }

        const whereClause = conditions.join(' AND ');
        const limit = Math.min(params.limit || 16, 20);

        console.log('[Search] Final WHERE:', whereClause);

        // First, get the TOTAL count of matching vehicles
        const countQuery = `SELECT COUNT(*) as total FROM direct_sales ds WHERE ${whereClause}`;
        const countResult = await prisma.$queryRawUnsafe<Array<{ total: bigint }>>(countQuery);
        const totalCount = Number(countResult[0]?.total || 0);
        console.log('[Search] Total matching vehicles:', totalCount);

        // Determine sorting
        const validSortFields = ['price', 'year', 'mileage', 'created_at'];
        const sortBy = validSortFields.includes(params.sortBy || '') ? params.sortBy : 'created_at';
        const sortOrder = (params.sortOrder?.toLowerCase() === 'asc') ? 'ASC' : 'DESC';

        // Then get the limited results for display
        const sqlQuery = `
            SELECT 
                ds.id, ds.make, ds.model, ds.year, ds.price, ds.mileage, 
                ds.location, ds.fuel_type, ds.transmission, ds.vehicle_condition, ds.engine_size,
                (SELECT photo_url FROM direct_sale_photos WHERE direct_sale_id = ds.id ORDER BY position_order ASC LIMIT 1) as photo
            FROM direct_sales ds
            WHERE ${whereClause}
            ORDER BY ds.${sortBy} ${sortOrder}
            LIMIT ${limit}
        `;

        console.log('[Search] SQL:', sqlQuery);

        const results = await prisma.$queryRawUnsafe<Array<{
            id: number;
            make: string | null;
            model: string | null;
            year: number | null;
            price: number | bigint | null;
            mileage: number | null;
            location: string | null;
            fuel_type: string | null;
            transmission: string | null;
            vehicle_condition: string | null;
            engine_size: string | null;
            photo: string | null;
        }>>(sqlQuery);

        console.log('[Search] Displaying:', results.length, 'of', totalCount, 'vehicles');

        const vehicles: ChatVehicle[] = results.map((v) => ({
            id: v.id,
            type: 'direct_sale' as const,
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
        }));

        return {
            success: true,
            count: totalCount, // Return the REAL total count
            vehicles,
            message: totalCount > 0
                ? `Found ${totalCount} vehicle(s) matching your criteria.`
                : 'No vehicles found matching your criteria. Try adjusting your search.',
        };
    } catch (error) {
        console.error('[Search Tool Error]', error);
        return {
            success: false,
            count: 0,
            vehicles: [],
            message: 'Sorry, there was an error searching for vehicles. Please try again.',
        };
    }
}
