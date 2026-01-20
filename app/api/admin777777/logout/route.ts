import { NextResponse } from "next/server"
import { clearAdminCookie } from "@/lib/admin-auth"
import { errorResponse } from "@/lib/errors"

export async function POST() {
  try {
    await clearAdminCookie()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin logout error:", error)
    console.error("Admin logout error:", error)
    return NextResponse.json(errorResponse(error), { status: 500 })
  }
}
