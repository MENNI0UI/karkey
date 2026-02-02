import { NextResponse } from "next/server"
import { getDirectSalesFilterOptions } from "@/app/actions"
import { errorResponse } from "@/lib/errors"

export async function GET() {
    try {
        const result = await getDirectSalesFilterOptions()
        return NextResponse.json(result)
    } catch (err: unknown) {
        console.error("[api/direct-sales/filters] Error:", err)
        return NextResponse.json(errorResponse(err), { status: 500 })
    }
}
