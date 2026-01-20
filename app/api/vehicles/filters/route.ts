import { NextResponse } from "next/server"
import { getFilterOptions } from "@/app/actions"

export async function GET() {
  try {
    const result = await getFilterOptions()
    return NextResponse.json(result)
  } catch (error) {
    console.error("[v0] Error in filter options API:", error)
    return NextResponse.json({ success: false, options: {}, error: "Failed to fetch filter options" }, { status: 500 })
  }
}
