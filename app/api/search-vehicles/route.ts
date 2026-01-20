import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { searchVehicles } from "@/app/actions";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const filters = {
      make: body.make,
      model: body.model,
      year: body.year,
      minPrice: body.minPrice,
      maxPrice: body.maxPrice,
      fuelType: body.fuelType,
      transmission: body.transmission,
      location: body.location,
    };
    const result = await searchVehicles(filters);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/search-vehicles] Error:", err);
    return NextResponse.json({ success: false, error: String(err), vehicles: [] }, { status: 500 });
  }
}
