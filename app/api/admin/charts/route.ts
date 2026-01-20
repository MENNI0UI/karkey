import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAdminFromCookie } from "@/lib/admin-auth"
import { errorResponse, ErrorCode } from "@/lib/errors"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromCookie()
    if (!admin || admin.role !== "ceo") {
      return NextResponse.json({ error: { code: ErrorCode.UNAUTHORIZED, message: "Unauthorized" } }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get("period") || "month"

    // Calculate date range
    let days = 30
    let startDate: Date
    const now = new Date()

    if (period === "week") {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      days = 7
    } else if (period === "month") {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      days = 30
    } else if (period === "year") {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      days = 365
    } else {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      days = 30
    }

    // Initialize default values
    let auctionDaily: any[] = []
    let auctionByStatus: any[] = []
    let topBrands: any[] = []
    let userDaily: any[] = []
    let userByType: any[] = []
    let userByStatus: any[] = []
    let vehicleDaily: any[] = []
    let vehicleByType: any[] = []
    let topCities: any[] = []

    // Auctions data
    try {
      auctionDaily = await prisma.$queryRaw<any[]>`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM auctions
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `
    } catch (e) {
      console.log("Auction daily query error:", e)
    }

    try {
      const result = await prisma.$queryRaw<any[]>`
        SELECT 
          status,
          COUNT(*) as count
        FROM auctions
        WHERE created_at >= ${startDate}
        GROUP BY status
      `
      auctionByStatus = Array.isArray(result) ? result : []
      console.log("[Charts API] Auction byStatus raw result:", JSON.stringify(result))
    } catch (e) {
      console.log("Auction status query error:", e)
    }

    try {
      topBrands = await prisma.$queryRaw<any[]>`
        SELECT 
          v.make as brand,
          COUNT(*) as count
        FROM auctions a
        JOIN vehicles v ON a.vehicle_id = v.id
        WHERE a.created_at >= ${startDate}
        GROUP BY v.make
        ORDER BY count DESC
        LIMIT 10
      `
    } catch (e) {
      console.log("Top brands query error:", e)
    }

    // Users data
    try {
      userDaily = await prisma.$queryRaw<any[]>`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM users
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `
    } catch (e) {
      console.log("User daily query error:", e)
    }

    try {
      userByType = await prisma.$queryRaw<any[]>`
        SELECT 
          COALESCE(user_type, 'individual') as type,
          COUNT(*) as count
        FROM users
        WHERE created_at >= ${startDate}
        GROUP BY user_type
      `
    } catch (e) {
      console.log("User type query error:", e)
    }

    try {
      userByStatus = await prisma.$queryRaw<any[]>`
        SELECT 
          COALESCE(verification_status, 'pending') as status,
          COUNT(*) as count
        FROM users
        WHERE created_at >= ${startDate}
        GROUP BY verification_status
      `
    } catch (e) {
      console.log("User status query error:", e)
    }

    // Vehicles data
    try {
      vehicleDaily = await prisma.$queryRaw<any[]>`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM vehicles
        WHERE created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `
    } catch (e) {
      console.log("Vehicle daily query error:", e)
    }

    try {
      vehicleByType = await prisma.$queryRaw<any[]>`
        SELECT 
          COALESCE(listing_type, 'showroom') as type,
          COUNT(*) as count
        FROM vehicles
        WHERE created_at >= ${startDate}
        GROUP BY listing_type
      `
    } catch (e) {
      console.log("Vehicle type query error:", e)
    }

    try {
      topCities = await prisma.$queryRaw<any[]>`
        SELECT 
          location as city,
          COUNT(*) as count
        FROM vehicles
        WHERE created_at >= ${startDate}
          AND location IS NOT NULL
          AND location != ''
        GROUP BY location
        ORDER BY count DESC
        LIMIT 10
      `
    } catch (e) {
      console.log("Top cities query error:", e)
    }

    // Format daily data to include all days in range
    const formatDailyData = (data: any[], daysCount: number) => {
      const result: { date: string; count: number }[] = []
      const dataMap = new Map<string, number>()

      // Build map from query results
      data.forEach((d: any) => {
        if (d.date) {
          const dateStr = new Date(d.date).toISOString().split('T')[0]
          dataMap.set(dateStr, Number(d.count) || 0)
        }
      })

      for (let i = daysCount - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        const displayDate = period === "year"
          ? date.toLocaleDateString("en-US", { month: "short" })
          : date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
        result.push({
          date: displayDate,
          count: dataMap.get(dateStr) || 0
        })
      }

      // For year view, aggregate by month
      if (period === "year") {
        const monthMap = new Map<string, number>()
        result.forEach(d => {
          const existing = monthMap.get(d.date) || 0
          monthMap.set(d.date, existing + d.count)
        })
        return Array.from(monthMap.entries()).map(([date, count]) => ({ date, count }))
      }

      return result
    }

    const chartData = {
      auctions: {
        daily: formatDailyData(auctionDaily, days),
        byStatus: auctionByStatus.map((s: any) => ({
          status: s.status || "unknown",
          count: Number(s.count) || 0
        })),
        topBrands: topBrands.map((b: any) => ({
          brand: b.brand || "Unknown",
          count: Number(b.count) || 0
        }))
      },
      users: {
        daily: formatDailyData(userDaily, days),
        byType: userByType.map((t: any) => ({
          type: t.type || "individual",
          count: Number(t.count) || 0
        })),
        byStatus: userByStatus.map((s: any) => ({
          status: s.status || "pending",
          count: Number(s.count) || 0
        }))
      },
      vehicles: {
        daily: formatDailyData(vehicleDaily, days),
        byType: vehicleByType.map((t: any) => ({
          type: t.type || "showroom",
          count: Number(t.count) || 0
        })),
        topCities: topCities.map((c: any) => ({
          city: c.city || "Unknown",
          count: Number(c.count) || 0
        }))
      }
    }

    console.log("[Charts API] Final byStatus data:", JSON.stringify(chartData.auctions.byStatus))

    return NextResponse.json({ success: true, data: chartData })
  } catch (error) {
    console.error("Charts API Error:", error)
    return NextResponse.json(errorResponse(error), { status: 500 })
  }
}
