import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { getNotificationsForUser } from "@/app/[lang]/notifications/actions";

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const userId = Number(session.user.id)
    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ success: false, error: "Invalid user" }, { status: 401 })
    }

    const notifications = await getNotificationsForUser(userId)
    const unreadCount = Array.isArray(notifications) ? notifications.filter((n: any) => !n.is_read).length : 0
    return NextResponse.json({ success: true, notifications, unreadCount })
  } catch (err: any) {
    console.error("[api/notifications/me] error:", err)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
