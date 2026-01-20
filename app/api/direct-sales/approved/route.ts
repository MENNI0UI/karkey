export const runtime = "nodejs"

import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const q = url.searchParams

    // Build Prisma where clauses
    const where: Prisma.direct_salesWhereInput = {
      verification_status: 'approved',
      sale_status: 'available'
    }

    // Multi-select filters
    const getMultiVal = (key: string) => {
      const vals = q.getAll(key)
      return vals.filter(v => v && v !== "All")
    }

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
    if (conditions.length > 0) {
      (where as any).vehicle_condition = { in: conditions.map(c => c.toLowerCase()) }
    }

    // Year filter (could also be multi-select if the frontend allows it)
    const years = getMultiVal('year')
    if (years.length > 0) where.year = { in: years.map(Number) }

    // Doors filter
    const doors = getMultiVal('doors')
    if (doors.length > 0) where.doors = { in: doors }

    // Price range
    const minPrice = q.get('minPrice')
    const maxPrice = q.get('maxPrice')
    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = Number(minPrice)
      if (maxPrice) where.price.lte = Number(maxPrice)
    }

    // Mileage range
    const minMileage = q.get('minMileage')
    const maxMileage = q.get('maxMileage')
    if (minMileage || maxMileage) {
      where.mileage = {}
      if (minMileage) where.mileage.gte = Number(minMileage)
      if (maxMileage) where.mileage.lte = Number(maxMileage)
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
      (where as any).exterior_color = { in: exteriorColors.map(c => c.toLowerCase()) }
    }

    const interiorColors = getMultiVal('interiorColor')
    if (interiorColors.length > 0) {
      (where as any).interior_color = { in: interiorColors.map(c => c.toLowerCase()) }
    }

    const originalPaint = q.get('originalPaint')
    if (originalPaint === 'yes') where.is_original_paint = true
    else if (originalPaint === 'no') where.is_original_paint = false

    // Count total
    const totalCount = await prisma.direct_sales.count({ where })

    // Pagination
    const limitRequested = Math.max(1, Math.min(200, Number(q.get('limit') ?? '12')))
    const offsetRequested = Math.max(0, Number(q.get('offset') ?? '0'))
    const take = Number.isFinite(limitRequested) ? Math.floor(limitRequested) : 12
    const skip = Number.isFinite(offsetRequested) ? Math.floor(offsetRequested) : 0

    // Fetch direct sales with seller info and photos
    const items = await prisma.direct_sales.findMany({
      where,
      include: {
        users_direct_sales_user_idTousers: {
          select: {
            id: true,
            username: true,
            phone_number: true
          }
        },
        direct_sale_photos: {
          select: { photo_url: true },
          orderBy: { position_order: 'asc' }
        }
      },
      orderBy: { created_at: 'desc' },
      take: take + 1,
      skip
    })

    const hasMore = items.length > take
    const effectiveItems = items.slice(0, take)

    // Map to response format
    const vehicles = effectiveItems.map((item) => {
      const photos = item.direct_sale_photos.map(p => p.photo_url).filter(Boolean) as string[];
      // Add service_history_url to photos if not already present (backward compatibility)
      if (item.service_history_url && !photos.includes(item.service_history_url)) {
        photos.push(item.service_history_url);
      }
      return {
        id: item.id,
        user_id: item.user_id,
        make: item.make,
        model: item.model,
        year: item.year,
        mileage: item.mileage,
        vehicle_condition: item.vehicle_condition,
        fuel_type: item.fuel_type,
        engine_size: item.engine_size ? Number(item.engine_size) : null,
        doors: item.doors,
        transmission: item.transmission,
        location: item.location,
        description: item.description,
        price: item.price ? Number(item.price) : null,
        verification_status: item.verification_status,
        sale_status: item.sale_status,
        created_at: item.created_at,
        updated_at: item.updated_at,
        photos,
        seller: item.users_direct_sales_user_idTousers ? {
          id: item.users_direct_sales_user_idTousers.id,
          username: item.users_direct_sales_user_idTousers.username,
          phone_number: item.users_direct_sales_user_idTousers.phone_number,
        } : null,
      };
    })

    return NextResponse.json(
      {
        success: true,
        vehicles,
        hasMore: Boolean(hasMore),
        totalCount,
        server_time: new Date().toISOString()
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    )
  } catch (err: unknown) {
    console.error("[api/direct-sales/approved] Error:", err)
    return NextResponse.json({ success: false, error: (err as Error).message, vehicles: [] }, { status: 500 })
  }
}
