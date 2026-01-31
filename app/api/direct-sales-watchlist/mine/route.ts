import { NextResponse } from "next/server";
import logger from "@/lib/logger";
import { getCurrentUser } from "@/lib/mysql-auth";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (currentUser as any).userId ?? (currentUser as any).id;

    if (!userId) {
      return NextResponse.json({ error: "Invalid user" }, { status: 400 });
    }

    // Fetch watchlist items
    const watchlistItems = await prisma.direct_sales_watchlist.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    });

    // Fetch direct sales for these watchlist items
    const directSaleIds = watchlistItems.map(item => item.direct_sale_id);

    if (directSaleIds.length === 0) {
      return NextResponse.json([]);
    }

    const directSales = await prisma.direct_sales.findMany({
      where: { id: { in: directSaleIds } },
      include: {
        direct_sale_photos: {
          select: { photo_url: true },
          orderBy: { position_order: 'asc' }
        }
      }
    });

    // Create a map for quick lookup
    const directSalesMap = new Map(directSales.map(ds => [ds.id, ds]));

    const result = watchlistItems.map((item) => {
      const ds = directSalesMap.get(item.direct_sale_id);
      return {
        id: Number(ds?.id ?? item.id ?? 0),
        user_id: ds?.user_id,
        make: ds?.make ?? "",
        model: ds?.model ?? "",
        year: ds?.year ?? null,
        mileage_km: ds?.mileage ?? null,
        fuel_type: ds?.fuel_type ?? null,
        engine_size: ds?.engine_size ? Number(ds.engine_size) : null,
        doors: ds?.doors ?? null,
        transmission: ds?.transmission ?? null,
        vehicle_condition: ds?.vehicle_condition ?? null,
        location: ds?.location ?? null,
        price: ds?.price ? Number(ds.price) : null,
        description: ds?.description ?? null,
        status: ds?.verification_status ?? "approved",
        photos: ds?.direct_sale_photos.map(p => p.photo_url).filter(Boolean) as string[] ?? [],
        created_at: ds?.created_at ?? null,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error("[direct-sales-watchlist/mine] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
