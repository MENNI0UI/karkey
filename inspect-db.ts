
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log("--- DATABASE INSPECTION ---");

    const countAll = await prisma.direct_sales.count();
    console.log(`Total cars in database: ${countAll}`);

    const approvedCount = await prisma.direct_sales.count({
        where: {
            verification_status: 'approved',
            sale_status: 'available'
        }
    });
    console.log(`Approved & Available cars: ${approvedCount}`);

    const mileageCars = await prisma.direct_sales.findMany({
        where: {
            verification_status: 'approved',
            sale_status: 'available',
            mileage: {
                lte: 3000
            }
        },
        select: {
            id: true,
            make: true,
            model: true,
            year: true,
            mileage: true,
            price: true
        }
    });

    console.log(`\nCars with mileage <= 3000km: ${mileageCars.length}`);
    mileageCars.forEach(v => {
        console.log(`- ID: ${v.id}, ${v.make} ${v.model} (${v.year}), Mileage: ${v.mileage}km, Price: ${v.price} DH`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
