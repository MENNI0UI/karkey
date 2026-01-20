import { NextResponse } from "next/server"
import { getFilterOptions } from "@/app/actions"

// Cache filter options for 5 minutes (they rarely change)
export const revalidate = 300

export async function GET() {
  try {
    const result = await getFilterOptions()
    const response = NextResponse.json(result)
    // Cache for 5 minutes, stale for 10 minutes
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    return response
  } catch (error) {
    console.error("[v0 API] ❌ Error in filter options API:", error)
    return NextResponse.json({ success: false, options: {} }, { status: 500 })
  }
}
