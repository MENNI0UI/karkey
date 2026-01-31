import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import logger from "@/lib/logger"

// GET - Public endpoint to fetch all active Karkey cars
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "12")
    const skip = (page - 1) * limit

    const [cars, total] = await Promise.all([
      prisma.karkey_cars.findMany({
        where: { is_active: true },
        include: {
          photos: {
            orderBy: { position_order: "asc" },
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      prisma.karkey_cars.count({
        where: { is_active: true },
      }),
    ])

    return NextResponse.json({
      cars,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    logger.error("Error fetching Karkey cars:", error)
    return NextResponse.json(
      { error: "Failed to fetch cars" },
      { status: 500 }
    )
  }
}
