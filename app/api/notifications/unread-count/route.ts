import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = Number(session.user.id)

    // Count unread notifications using Prisma
    const count = await prisma.notifications.count({
      where: {
        user_id: userId,
        is_read: false
      }
    })
    return NextResponse.json({ count })
  } catch (err: any) {
    // handle DB unavailable distinctly
    if (err?.code === "DB_UNAVAILABLE" || String(err.message).includes("ECONNREFUSED")) {
      console.warn("[API][unread-count] DB unavailable, returning safe default")
      return NextResponse.json({ count: 0, error: "database_unavailable" }, { status: 503 })
    }
    console.error("[API][unread-count] unexpected error:", err)
    return NextResponse.json({ count: 0, error: "server_error" }, { status: 500 })
  }
}
