import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { errorResponse } from "@/lib/errors"

export async function GET() {
    try {
        // Fetch distinct combinations of make, model, year for active direct sale items
        const rows = await prisma.direct_sales.findMany({
            where: {
                verification_status: 'approved'
            },
            select: {
                make: true,
                model: true,
                year: true,
            },
            distinct: ['make', 'model', 'year'],
            orderBy: { make: 'asc' }
        })

        return NextResponse.json({ success: true, filters: rows })
    } catch (err: unknown) {
        console.error("[api/direct-sales/filters] Error:", err)
        return NextResponse.json(errorResponse(err), { status: 500 })
    }
}
