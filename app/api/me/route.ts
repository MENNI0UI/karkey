import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/mysql-auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }
    const u = user as { id?: number; userId?: number; username?: string; email?: string; first_name?: string; last_name?: string; profile_picture?: string; verification_status?: string }
    const safe = {
      id: Number(u.id ?? u.userId ?? null),
      username: u.username ?? u.email ?? null,
      email: u.email ?? null,
      first_name: u.first_name ?? null,
      last_name: u.last_name ?? null,
      profile_picture: u.profile_picture ?? null,
      verification_status: u.verification_status ?? null,
    }
    return NextResponse.json({ success: true, user: safe })
  } catch (err) {
    console.error("/api/me error:", err)
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 })
  }
}
