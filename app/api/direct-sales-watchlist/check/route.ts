import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";
import logger from "@/lib/logger";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, saved: false, error: "Not authenticated" }, { status: 200 });
    }

    const userId = Number(session.user.id);
    if (Number.isNaN(userId)) {
      return NextResponse.json({ success: false, saved: false, error: "Invalid user session" }, { status: 200 });
    }

    const url = new URL(request.url);
    const direct_sale_id = Number(url.searchParams.get("direct_sale_id") ?? url.searchParams.get("directSaleId") ?? null);
    if (!direct_sale_id || Number.isNaN(direct_sale_id)) {
      return NextResponse.json({ success: false, saved: false, error: "Invalid direct_sale_id" }, { status: 400 });
    }

    // check watchlist existence using Prisma
    const existing = await prisma.direct_sales_watchlist.findFirst({
      where: {
        user_id: userId,
        direct_sale_id: direct_sale_id,
      },
      select: { id: true }
    });

    const saved = !!existing;

    return NextResponse.json({ success: true, saved }, { status: 200 });
  } catch (error: unknown) {
    logger.error("[api/direct-sales-watchlist/check] error:", error);
    return NextResponse.json({ success: false, saved: false, error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}
