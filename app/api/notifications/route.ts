import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { debug, warn, error as logError } from "@/lib/logger"

// Helper: normalize a notification row into client-friendly shape
const normalizeNotification = (n: any) => {
  const idRaw = n?.id ?? n?.notification_id ?? n?.notificationId ?? n?._id ?? null
  const idNum = Number(idRaw)
  const createdRaw = n?.created_at ?? n?.createdAt ?? n?.ts ?? n?.timestamp ?? null
  let createdIso: string | null = null
  if (createdRaw == null) {
    createdIso = null
  } else if (typeof createdRaw === "number") {
    // convert seconds -> ms if needed
    const ms = createdRaw < 1e12 ? createdRaw * 1000 : createdRaw
    createdIso = new Date(ms).toISOString()
  } else if (createdRaw instanceof Date) {
    createdIso = createdRaw.toISOString()
  } else {
    const d = new Date(createdRaw as string)
    createdIso = Number.isNaN(d.getTime()) ? null : d.toISOString()
  }

  return {
    id: Number.isFinite(idNum) ? idNum : idRaw,
    user_id: n?.user_id ?? n?.userId ?? null,
    title: (n?.title ?? "") + "",
    message: (n?.message ?? "") + "",
    type: (n?.type ?? "info") + "",
    is_read: !!(n?.is_read ?? n?.read ?? n?.isRead),
    created_at: createdIso,
  }
}

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = Number(session.user.id)

    // Fetch notifications using Prisma
    const raw = await prisma.notifications.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    })
    const notifications = raw.map((n: typeof raw[number]) => normalizeNotification(n))
    return NextResponse.json({ notifications })
  } catch (error) {
    logError("[NOTIFICATIONS API][GET] Error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = Number(session.user.id)
    const body = await request.json()
    const { action, notificationId } = body

    if (action === "markAsRead" && notificationId) {
      // Mark single notification as read using Prisma
      await prisma.notifications.update({
        where: { id: Number(notificationId), user_id: userId },
        data: { is_read: true }
      })
    } else if (action === "markAllAsRead") {
      // Mark all user notifications as read using Prisma
      await prisma.notifications.updateMany({
        where: { user_id: userId },
        data: { is_read: true }
      })
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    // Return updated notifications after mutation to let client re-sync immediately
    const raw = await prisma.notifications.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' }
    })
    const notifications = raw.map((n: typeof raw[number]) => normalizeNotification(n))
    const unreadCount = notifications.filter((n: any) => !n.is_read).length

    return NextResponse.json({ success: true, notifications, unreadCount })
  } catch (error) {
    logError("[NOTIFICATIONS API][POST] Error:", error)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}

