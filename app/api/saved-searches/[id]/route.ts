import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { error as logError } from "@/lib/logger"

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email }
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
