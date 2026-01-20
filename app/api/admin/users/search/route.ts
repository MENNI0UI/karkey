import { NextResponse } from "next/server"
import { getAdminFromCookie } from "@/lib/admin-auth"
import prisma from "@/lib/prisma"
import { errorResponse, ErrorCode } from "@/lib/errors"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromCookie()
    if (!admin) {
      return NextResponse.json({ error: { code: ErrorCode.UNAUTHORIZED, message: "Unauthorized" } }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""

    let users: any[] = []

    if (query.trim()) {
      users = await prisma.users.findMany({
        where: {
          OR: [
            { username: { contains: query.trim() } },
            { email: { contains: query.trim() } }
          ]
        },
        select: {
          id: true,
          username: true,
          email: true,
          user_type: true,

          created_at: true
        },
        orderBy: { created_at: 'desc' }
      })
    }

    return NextResponse.json({ success: true, users })
  } catch (error) {
    console.error("User search error:", error)
    return NextResponse.json(errorResponse(error), { status: 500 })
  }
}
