import { NextResponse } from "next/server"
import { searchVehicles } from "@/app/actions"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const filters = {
      make: searchParams.get("make") || undefined,
      model: searchParams.get("model") || undefined,
      year: searchParams.get("year") || undefined,
      minPrice: searchParams.get("minPrice") || undefined,
      maxPrice: searchParams.get("maxPrice") || undefined,
      fuelType: searchParams.get("fuelType") || undefined,
      transmission: searchParams.get("transmission") || undefined,
      location: searchParams.get("location") || undefined,
    }

    console.log("[v0 API] 🔍 Search request with filters:", filters)

    const result = await searchVehicles(filters)
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0 API] ❌ Error in search API:", error)
    return NextResponse.json({ success: false, vehicles: [], error: "Failed to search vehicles" }, { status: 500 })
  }
}
