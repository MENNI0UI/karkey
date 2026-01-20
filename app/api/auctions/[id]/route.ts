import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import path from "path";
import { IdParamSchema } from "@/lib/schemas";
import { errorResponse, ErrorCode } from "@/lib/errors";

/**
 * 🆕 النظام الجديد: المزادات الآن في direct_sales مع auction_mode=true
 */

function normalizePhotoUrl(p: any) {
  if (!p) return null;
  const s = String(p).trim();
  if (!s) return null;
  if (s.startsWith("http://") || s.startsWith("https://")) return s;
  if (s.startsWith("/")) {
    if (s.startsWith("/uploads/")) return `/api${s}`;
    return s;
  }
  return `/api/uploads/direct-sales/${path.basename(s)}`;
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idParam } = await params;

    // Validate ID parameter with Zod
    const parsed = IdParamSchema.safeParse({ id: idParam });
    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: { code: ErrorCode.VALIDATION_ERROR, message: "Invalid id", details: parsed.error.flatten() }
      }, { status: 400 });
    }

    const id = parsed.data.id;

    // Fetch auction from direct_sales
    const auction = await prisma.direct_sales.findFirst({
      where: {
        id,
        auction_mode: true
      },
      include: {
        direct_sale_photos: {
          orderBy: { position_order: 'asc' }
        },
        users_direct_sales_user_idTousers: {
          select: {
            id: true,
            username: true,
            first_name: true,
            last_name: true,
            profile_picture: true,
          }
        }
      }
    });

    if (!auction) {
      return NextResponse.json({ success: false, error: { code: ErrorCode.NOT_FOUND, message: "Auction not found" } }, { status: 404 });
    }

    const photos = auction.direct_sale_photos
      .map((r) => normalizePhotoUrl(r.photo_url))
      .filter(Boolean) as string[];

    const seller = auction.users_direct_sales_user_idTousers;

    const safeNumber = (v: any) => {
      if (v === null || v === undefined || v === "") return null
      try {
        if (typeof v === 'object') {
          if (typeof (v as any).toNumber === 'function') return Number((v as any).toNumber())
          if (typeof (v as any).toString === 'function') return Number(String(v))
        }
        return Number(v)
      } catch { return null }
    }

    const result = {
      success: true,
      auction: {
        id: Number(auction.id),
        vehicle_id: Number(auction.id),
        starting_price: safeNumber(auction.auction_starting_price),
        current_bid: safeNumber(auction.auction_current_bid),
        reserve_price: safeNumber(auction.auction_reserve_price),
        bid_count: auction.auction_bid_count ?? 0,
        start_date: auction.auction_start_date ? new Date(auction.auction_start_date).toISOString() : null,
        end_date: auction.auction_end_date ? new Date(auction.auction_end_date).toISOString() : null,
        status: auction.auction_status ?? null,
        created_at: auction.created_at ? new Date(auction.created_at).toISOString() : null,
      },
      vehicle: {
        id: auction.id,
        make: auction.make ?? null,
        model: auction.model ?? null,
        year: safeNumber(auction.year),
        mileage: safeNumber(auction.mileage),
        transmission: auction.transmission ?? null,
        fuel_type: auction.fuel_type ?? null,
        engine_size: safeNumber(auction.engine_size),
        doors: safeNumber(auction.doors),
        exterior_color: auction.exterior_color ?? null,
        interior_color: auction.interior_color ?? null,
        is_original_paint: auction.is_original_paint ?? null,
        vehicle_condition: auction.vehicle_condition ?? null,
        location: auction.location ?? null,
        description: auction.description ?? null,
        special_features: auction.special_features ?? null,
        verification_status: auction.verification_status ?? null,
        photos,
      },
      seller: {
        id: seller?.id ?? null,
        username: seller?.username ?? null,
        first_name: seller?.first_name ?? null,
        last_name: seller?.last_name ?? null,
        profile_picture: seller?.profile_picture ?? null,
      },
      server_time: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/auctions/[id]] error:", err);
    return NextResponse.json(errorResponse(err), { status: 500 });
  }
}
