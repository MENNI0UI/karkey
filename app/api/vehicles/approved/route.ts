import { NextResponse } from "next/server"
import { getApprovedVehicles } from "@/app/actions"

// Cache approved vehicles for 60 seconds to reduce database load
export const revalidate = 60

export async function GET() {
  try {
    // Read query params (q, make, model, year, location) if present
    // const { searchParams } = new URL(String(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost"))
    // Note: Next's RouteHandler receives the Request via arguments in future versions; simple fallback here.
    const result = await getApprovedVehicles()
    
    // Add cache headers for CDN and browser caching
    const response = NextResponse.json(result)
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120')
    return response
  } catch (error) {
    console.error("[v0] Error in approved vehicles API:", error)
    return NextResponse.json({ success: false, vehicles: [], error: "Failed to fetch vehicles" }, { status: 500 })
  }
}
