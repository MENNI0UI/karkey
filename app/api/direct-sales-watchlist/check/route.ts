import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/mysql-auth";
import prisma from "@/lib/prisma";

import { auth } from "@/auth";

export async function GET(request: NextRequest) {
  try {
    let userId: number | null = null;

    // 1. Try NextAuth first
    const session = await auth();
    if (session?.user?.id) {
      userId = Number(session.user.id);
    }

    // 2. Fallback to legacy token if no session
    if (!userId) {
      const token =
        request.cookies.get("auth_token")?.value ??
        request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
        null;

      if (token) {
        const payload = await verifyToken(token);
        if (payload && typeof payload.userId === "number") {
          userId = payload.userId;
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ success: false, saved: false, error: "Not authenticated" }, { status: 200 });
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
    console.error("[api/direct-sales-watchlist/check] error:", error);
    return NextResponse.json({ success: false, saved: false, error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}
