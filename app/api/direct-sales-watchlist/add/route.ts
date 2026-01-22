import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

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

    // check for existing watchlist entry using Prisma
    const existing = await prisma.direct_sales_watchlist.findFirst({
      where: {
        user_id: userId,
        direct_sale_id: direct_sale_id,
      }
    });

    if (existing) {
      return NextResponse.json({ success: true, alreadyExists: true }, { status: 200 });
    }

    // insert into watchlist
    await prisma.direct_sales_watchlist.create({
      data: {
        user_id: userId,
        direct_sale_id: direct_sale_id,
        created_at: new Date(),
      }
    });

    return NextResponse.json({ success: true, added: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("[api/direct-sales-watchlist/add] error:", error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "Server error" }, { status: 500 });
  }
}
