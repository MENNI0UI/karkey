const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function testSearchQuery(year) {
    // This simulates the exact query from lib/ai/tools.ts
    const conditions = [
        "verification_status = 'approved'",
        "sale_status = 'available'",
        `year >= ${year}`,
        `year <= ${year}`
    ];
    
    const whereClause = conditions.join(' AND ');
    const sqlQuery = `
        SELECT 
            ds.id, ds.make, ds.model, ds.year, ds.price, ds.mileage, 
            ds.location, ds.fuel_type, ds.transmission, ds.vehicle_condition,
            (SELECT photo_url FROM direct_sale_photos WHERE direct_sale_id = ds.id ORDER BY position_order ASC LIMIT 1) as photo
        FROM direct_sales ds
        WHERE ${whereClause}
        ORDER BY ds.created_at DESC
        LIMIT 6
    `;
    
    console.log(`\n=== Testing SQL for year ${year} ===`);
    console.log('SQL:', sqlQuery.trim());
    
    const results = await p.$queryRawUnsafe(sqlQuery);
    console.log('Results:', results.length, 'cars found');
    results.forEach(r => {
        console.log(`  - ${r.make} ${r.model} ${r.year} - ${r.price} MAD`);
    });
    
    return results;
}

async function main() {
    await testSearchQuery(2023);
    await testSearchQuery(2025);
    await testSearchQuery(2004);
    await p.$disconnect();
}

main().catch(console.error);
