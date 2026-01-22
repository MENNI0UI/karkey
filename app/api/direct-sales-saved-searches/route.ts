import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { error as logError } from "@/lib/logger"

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

    // fetch user's direct-sales saved searches using Prisma
    const rows = await prisma.direct_sales_saved_searches.findMany({
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
    // Serialize BigInt fields to Number
    const serializedRows = rows.map(row => ({
      ...row,
      id: Number(row.id),
      user_id: Number(row.user_id),
    }))
    return NextResponse.json({ success: true, saved_searches: serializedRows })
  } catch (error) {
    logError("[DIRECT-SALES SAVED SEARCHES][GET] Error:", error)
    return NextResponse.json({ error: "Failed to fetch direct-sales saved searches" }, { status: 500 })
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
    const { name, params, replaceExisting } = body
    if (!name || !params) return NextResponse.json({ error: "Missing name or params" }, { status: 400 })

    // Use shared canonicalization logic to handle arrays (multi-select) correctly
    const paramsStr = JSON.stringify(params)

    // Check if a saved search with the same params already exists
    const existing = await prisma.direct_sales_saved_searches.findFirst({
      where: {
        user_id: user.id,
        params: paramsStr,
      }
    })

    if (existing) {
      // Return existing search instead of creating duplicate
      return NextResponse.json({ success: true, id: Number(existing.id), existing: true })
    }

    // If replaceExisting is true, delete all previous saved searches for this user
    if (replaceExisting) {
      await prisma.direct_sales_saved_searches.deleteMany({
        where: { user_id: user.id }
      })
    }

    // create saved search using Prisma
    const result = await prisma.direct_sales_saved_searches.create({
      data: {
        user_id: user.id,
        name: String(name).slice(0, 200),
        params: paramsStr,
        is_active: true,
        created_at: new Date(),
      }
    })

    return NextResponse.json({ success: true, id: Number(result.id) })
  } catch (error) {
    logError("[DIRECT-SALES SAVED SEARCHES][POST] Error:", error)
    return NextResponse.json({ error: "Failed to create direct-sales saved search" }, { status: 500 })
  }
}
