import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import logger from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Authentication required" }, { status: 401 });
    }

    const userId = Number(session.user.id);
    if (Number.isNaN(userId)) {
      return NextResponse.json({ success: false, error: "Invalid user session" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const direct_sale_id = Number(body?.direct_sale_id ?? body?.directSaleId ?? null);
    if (!direct_sale_id || Number.isNaN(direct_sale_id)) {
      return NextResponse.json({ success: false, error: "Invalid direct_sale_id" }, { status: 400 });
    }

    // remove from watchlist using Prisma
    await prisma.direct_sales_watchlist.deleteMany({
      where: {
        user_id: userId,
        direct_sale_id: direct_sale_id,
      }
    });

    return NextResponse.json({ success: true, removed: true }, { status: 200 });
  } catch (error: unknown) {
    logger.error("[api/direct-sales-watchlist/remove] error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}
