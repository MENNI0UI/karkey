import prisma from '@/lib/prisma';
import { mapVehicle } from '@/app/actions/utils/mappers';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const idsString = searchParams.get('ids');

        if (!idsString) {
            return new Response(JSON.stringify({ vehicles: [] }), { status: 200 });
        }

        const idList = idsString.split(',').map(id => {
            const num = Number.parseInt(id, 10);
            return Number.isNaN(num) ? id : num;
        });

        // Search in direct_sales
        const sales = await prisma.direct_sales.findMany({
            where: {
                id: { in: idList.filter(id => typeof id === 'number') as number[] }
            },
            include: {
                users_direct_sales_user_idTousers: {
                    select: { id: true, username: true, profile_picture: true }
                },
                direct_sale_photos: {
                    orderBy: { position_order: 'asc' },
                    take: 1
                }
            }
        });

        // Search in karkey_cars (if any IDs are strings or didn't match numbers)
        // For simplicity, we assume IDs are unique enough or we check both.

        const mappedSales = sales.map(mapVehicle).map(v => ({
            ...(v as object),
            type: (v as any).auction_mode ? 'auction' : 'sale'
        }));

        return new Response(JSON.stringify({ vehicles: mappedSales }), {
            headers: { 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error('[Batch Fetch Error]', error);
        return new Response(JSON.stringify({ error: 'Failed to fetch vehicles' }), { status: 500 });
    }
}
