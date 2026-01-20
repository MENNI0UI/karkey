import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/mysql-auth"
import prisma from "@/lib/prisma"
import { error as logError } from "@/lib/logger"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const tokenFromCookie = cookieStore.get("auth_token")?.value
    const authHeader = request.headers.get("authorization") || ""
    const token = tokenFromCookie ?? (authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : undefined)

    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const payload = await verifyToken(token)
    if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

    const user = await prisma.users.findUnique({
      where: { email: payload.email as string }
    })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const { id: idParam } = await params
    const id = Number(idParam)
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 })

    // delete only if belongs to user using Prisma
    await prisma.saved_searches.deleteMany({
      where: {
        id: id,
        user_id: user.id
      }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    logError("[SAVED SEARCHES][DELETE] Error:", error)
    return NextResponse.json({ error: "Failed to delete saved search" }, { status: 500 })
  }
}
