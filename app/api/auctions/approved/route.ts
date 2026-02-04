// export const runtime = "nodejs" // Incompatible with useCache experiment

import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import path from "path"
import { Prisma } from "@prisma/client"
import logger from "@/lib/logger"

/**
 * 🆕 النظام الجديد: المزادات الآن في direct_sales مع auction_mode=true
 */
export async function GET(request: Request) {
  const url = new URL(request.url)
  const q = url.searchParams
  const pageLimitRequested = Math.max(1, Math.min(200, Number(q.get("limit") ?? "12")))
  const offsetParam = Math.max(0, Number(q.get("offset") ?? "0"))
  const pageLimit = Number.isFinite(pageLimitRequested) ? Math.floor(pageLimitRequested) : 12
  const offset = Number.isFinite(offsetParam) ? Math.floor(offsetParam) : 0

  try {
    // Build where clause for active auctions
    const where: Prisma.direct_salesWhereInput = {
      verification_status: 'approved',
      auction_mode: true,
      auction_status: 'active',
      auction_end_date: { gt: new Date() },
    }

    // Multi-select filters helper
    const getMultiVal = (key: string) => {
      const vals = q.getAll(key)
      return vals.filter(v => v && v !== "All")
    }

    // Apply filters
    const makes = getMultiVal('make')
    if (makes.length > 0) where.make = { in: makes }

    const models = getMultiVal('model')
    if (models.length > 0) where.model = { in: models }

    const fuels = getMultiVal('fuel')
    if (fuels.length > 0) where.fuel_type = { in: fuels as any[] }

    const transmissions = getMultiVal('transmission')
    if (transmissions.length > 0) where.transmission = { in: transmissions as any[] }

    const locations = getMultiVal('location')
    if (locations.length > 0) where.location = { in: locations }

    const conditions = getMultiVal('condition')
    if (conditions.length > 0) where.vehicle_condition = { in: conditions as any[] }

    const years = getMultiVal('year')
    if (years.length > 0) where.year = { in: years.map(Number) }

    const doors = getMultiVal('doors')
    if (doors.length > 0) where.doors = { in: doors as any[] }

    // Mileage range
    const minMileage = q.get('minMileage')
    const maxMileage = q.get('maxMileage')
    if (minMileage || maxMileage) {
      where.mileage = {}
      if (minMileage) (where.mileage as any).gte = Number(minMileage)
      if (maxMileage) (where.mileage as any).lte = Number(maxMileage)
    }

    // Engine size range
    const minEngine = q.get('minEngine')
    const maxEngine = q.get('maxEngine')

    if (minEngine || maxEngine) {
      where.engine_size = {}
      if (minEngine) (where.engine_size as any).gte = String(minEngine)
      if (maxEngine) (where.engine_size as any).lte = String(maxEngine)
    }

    // Color filters
    const exteriorColors = getMultiVal('exteriorColor')
    if (exteriorColors.length > 0) {
      where.exterior_color = { in: exteriorColors.map(c => c.toLowerCase()) }
    }

    const interiorColors = getMultiVal('interiorColor')
    if (interiorColors.length > 0) {
      where.interior_color = { in: interiorColors.map(c => c.toLowerCase()) }
    }

    const originalPaint = q.get('originalPaint')
    if (originalPaint === 'yes') where.is_original_paint = true
    else if (originalPaint === 'no') where.is_original_paint = false

    // Price range filter (on starting_price)
    const minPrice = q.get('minPrice')
    const maxPrice = q.get('maxPrice')
    if (minPrice || maxPrice) {
      where.auction_starting_price = {}
      if (minPrice) (where.auction_starting_price as any).gte = Number(minPrice)
      if (maxPrice) (where.auction_starting_price as any).lte = Number(maxPrice)
    }

    // Count total
    const totalCount = await prisma.direct_sales.count({ where })

    // Fetch auctions with photos
    const rows = await prisma.direct_sales.findMany({
      where,
      include: {
        direct_sale_photos: {
          orderBy: { position_order: 'asc' }
        }
      },
      orderBy: { created_at: 'desc' },
      take: pageLimit + 1,
      skip: offset
    })

    const hasMore = rows.length > pageLimit
    const effectiveRows = rows.slice(0, pageLimit)

    // Helper: normalize photo urls
    const normalizePhotoUrl = (raw?: string | null) => {
      if (!raw) return null
      try {
        const s = String(raw).trim()
        if (!s) return null
        if (s.startsWith("http://") || s.startsWith("https://")) return s
        if (s.startsWith("/")) return s
        if (s.includes("uploads/")) return s.startsWith("/") ? s : `/${s}`
        const base = path.basename(s)
        return base ? `/uploads/direct-sales/${base}` : null
      } catch {
        return null
      }
    }

    // Normalize response
    const auctions = effectiveRows.map((r) => {
      const photos = r.direct_sale_photos
        .map(p => normalizePhotoUrl(p.photo_url))
        .filter((url): url is string => url !== null)

      return {
        id: r.id,
        starting_price: r.auction_starting_price ? Number(r.auction_starting_price) : null,
        current_bid: r.auction_current_bid ? Number(r.auction_current_bid) : null,
        reserve_price: r.auction_reserve_price ? Number(r.auction_reserve_price) : null,
        bid_count: r.auction_bid_count ?? 0,
        vehicle_id: r.id,
        start_date: r.auction_start_date ? new Date(r.auction_start_date).toISOString() : null,
        end_date: r.auction_end_date ? new Date(r.auction_end_date).toISOString() : null,
        created_at: r.created_at,
        // Vehicle fields
        make: r.make ?? null,
        model: r.model ?? null,
        year: r.year ?? null,
        mileage: r.mileage ?? null,
        transmission: r.transmission ?? null,
        fuel_type: r.fuel_type ?? null,
        engine_size: r.engine_size ? Number(r.engine_size) : null,
        doors: r.doors ?? null,
        vehicle_condition: r.vehicle_condition ?? null,
        location: r.location ?? null,
        description: r.description ?? null,
        vehicle_verification_status: r.verification_status ?? null,
        photos,
        title: (r.make || r.model) ? `${r.make ?? ""} ${r.model ?? ""}`.trim() : null,
      }
    })

    return NextResponse.json(
      { auctions, hasMore: Boolean(hasMore), totalCount, server_time: new Date().toISOString() },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    )
  } catch (err: any) {
    if (err?.code === "DB_UNAVAILABLE" || String(err).includes("ECONNREFUSED")) {
      logger.warn("[API/auctions/approved] DB unavailable:", err?.message ?? err)
      return NextResponse.json({ auctions: [], error: "database_unavailable" }, { status: 503 })
    }
    logger.error("[API/auctions/approved] unexpected error:", err)
    return NextResponse.json({ auctions: [], error: "server_error" }, { status: 500 })
  }
}
