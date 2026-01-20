import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET - Fetch a single Karkey car by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idParam } = await params
        const id = parseInt(idParam)
        if (isNaN(id)) {
            return NextResponse.json({ error: "Invalid car ID" }, { status: 400 })
        }

        const car = await prisma.karkey_cars.findFirst({
            where: { id, is_active: true },
            include: {
                photos: {
                    orderBy: { position_order: "asc" },
                },
            },
        })

        if (!car) {
            return NextResponse.json({ error: "Car not found" }, { status: 404 })
        }

        return NextResponse.json(car)
    } catch (error) {
        console.error("Error fetching Karkey car:", error)
        return NextResponse.json(
            { error: "Failed to fetch car" },
            { status: 500 }
        )
    }
}
