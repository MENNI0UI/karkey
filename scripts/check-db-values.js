const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // Get sample record
    const sample = await prisma.direct_sales.findFirst({
        select: {
            fuel_type: true,
            engine_size: true,
            mileage: true,
            price: true,
            doors: true,
            auction_starting_price: true
        }
    });
    console.log('Sample record:', sample);

    const fuelTypes = await prisma.direct_sales.groupBy({
        by: ['fuel_type'],
        _count: true
    });
    console.log('\nFuel types in DB:', JSON.stringify(fuelTypes, null, 2));
    
    const doors = await prisma.direct_sales.groupBy({
        by: ['doors'],
        _count: true
    });
    console.log('\nDoors in DB:', JSON.stringify(doors, null, 2));
    
    // Check engine sizes
    const engines = await prisma.direct_sales.groupBy({
        by: ['engine_size'],
        _count: true,
        take: 10
    });
    console.log('\nEngine sizes in DB:', JSON.stringify(engines, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
