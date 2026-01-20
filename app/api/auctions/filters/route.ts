import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { errorResponse } from "@/lib/errors"

/**
 * 🆕 النظام الجديد: الفلاتر من direct_sales مع auction_mode=true
 */
export async function GET() {
    try {
        // Fetch distinct combinations of make, model, year for vehicles in active auctions
        const rows = await prisma.direct_sales.findMany({
            where: {
                verification_status: 'approved',
                auction_mode: true,
                auction_status: 'active',
                auction_end_date: { gt: new Date() }
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
        console.error("[api/auctions/filters] Error:", err)
        return NextResponse.json(errorResponse(err), { status: 500 })
    }
}
