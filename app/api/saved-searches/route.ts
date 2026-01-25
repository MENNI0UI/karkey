import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { error as logError } from "@/lib/logger"

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email }
    })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    // fetch user's saved searches using Prisma
    const rows = await prisma.saved_searches.findMany({
      where: { user_id: user.id },
      select: {
        id: true,
        user_id: true,
        name: true,
        params: true,
        is_active: true,
        last_notified_at: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' }
    })
    // Serialize to ensure compatibility and set no-cache headers
    const serializedRows = rows.map(row => ({
      ...row,
      id: Number(row.id),
      user_id: Number(row.user_id),
    }))
    return NextResponse.json(
      { success: true, saved_searches: serializedRows },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    )
  } catch (error) {
    logError("[SAVED SEARCHES][GET] Error:", error)
    return NextResponse.json({ error: "Failed to fetch saved searches" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email }
    })
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 })

    const body = await request.json()
    const { name, params } = body
    if (!name || !params) return NextResponse.json({ error: "Missing name or params" }, { status: 400 })

    const paramsStr = JSON.stringify(params)

    // create saved search using Prisma
    const result = await prisma.saved_searches.create({
      data: {
        user_id: user.id,
        name: String(name).slice(0, 200),
        params: paramsStr,
        is_active: true,
        created_at: new Date(),
      }
    })

    return NextResponse.json({ success: true, id: result.id })
  } catch (error) {
    logError("[SAVED SEARCHES][POST] Error:", error)
    return NextResponse.json({ error: "Failed to create saved search" }, { status: 500 })
  }
}
