import { NextRequest, NextResponse } from "next/server"
import { getAdminFromCookie } from "@/lib/admin-auth"
import prisma from "@/lib/prisma"
import { error as logError } from "@/lib/logger"

export const dynamic = "force-dynamic"

// GET - List all Karkey car inquiries (admin only)
export async function GET(request: NextRequest) {
    try {
        const admin = await getAdminFromCookie()
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const processed = searchParams.get("processed")
        const carId = searchParams.get("car_id")
        const page = parseInt(searchParams.get("page") || "1")
        const limit = parseInt(searchParams.get("limit") || "20")
        const skip = (page - 1) * limit

        const where: any = {}
        if (processed !== null) {
            where.is_processed = processed === "true"
        }
        if (carId) {
            where.karkey_car_id = parseInt(carId)
        }

        const [inquiries, total] = await Promise.all([
            prisma.karkey_car_inquiries.findMany({
                where,
                include: {
                    karkey_cars: {
                        select: {
                            id: true,
                            make: true,
                            model: true,
                            year: true,
                            price: true,
                            photos: {
                                take: 1,
                                orderBy: { position_order: "asc" },
                            },
                        },
                    },
                },
                orderBy: { created_at: "desc" },
                skip,
                take: limit,
            }),
            prisma.karkey_car_inquiries.count({ where }),
        ])

        // Get unprocessed count for badge
        const unprocessedCount = await prisma.karkey_car_inquiries.count({
            where: { is_processed: false },
        })

        return NextResponse.json({
            success: true,
            inquiries,
            unprocessedCount,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (err) {
        logError("[admin karkey-car-inquiries GET] Error:", err)
        return NextResponse.json(
            { error: "Failed to fetch inquiries" },
            { status: 500 }
        )
    }
}

// PUT - Mark inquiry as processed (admin only)
export async function PUT(request: NextRequest) {
    try {
        const admin = await getAdminFromCookie()
        if (!admin) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await request.json()
        const { inquiry_id, is_processed } = body

        if (!inquiry_id) {
            return NextResponse.json(
                { error: "Inquiry ID is required" },
                { status: 400 }
            )
        }

        const inquiry = await prisma.karkey_car_inquiries.update({
            where: { id: inquiry_id },
            data: {
                is_processed: is_processed !== false,
                processed_by: admin.id,
                processed_at: is_processed !== false ? new Date() : null,
            },
        })

        return NextResponse.json({
            success: true,
            inquiry,
        })
    } catch (err) {
        logError("[admin karkey-car-inquiries PUT] Error:", err)
        return NextResponse.json(
            { error: "Failed to update inquiry" },
            { status: 500 }
        )
    }
}
