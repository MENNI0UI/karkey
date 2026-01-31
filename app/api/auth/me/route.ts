import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import logger from "@/lib/logger"
import { getUserProfile } from "@/app/[lang]/profile/actions";

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, user: null })
    }

    const userId = Number(session.user.id)
    let profile = null
    try {
      profile = await getUserProfile(userId)
    } catch { /* ignore */ }

    return NextResponse.json({
      success: true,
      user: {
        id: userId,
        email: session.user.email,
        name: session.user.name,
        phone: (session.user as any).phone,
        // Merge profile fields directly for the header logic to pick them up
        profile_picture: (profile as any)?.profile_picture || null,
        first_name: (profile as any)?.first_name || null,
        last_name: (profile as any)?.last_name || null,
      },
      profile
    })
  } catch (err) {
    logger.error("[api/auth/me] error:", err)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
