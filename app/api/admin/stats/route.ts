import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAdminFromCookie } from "@/lib/admin-auth"
import { errorResponse, ErrorCode } from "@/lib/errors"

/**
 * GET /api/admin/stats
 * Returns platform statistics for admin dashboard (CEO/Finance)
 * OPTIMIZED: Combined queries to reduce database round-trips from ~30 to ~10
 */
export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminFromCookie()
    if (!admin) {
      return NextResponse.json({ success: false, error: { code: ErrorCode.UNAUTHORIZED, message: "Unauthorized" } }, { status: 401 })
    }

    // Only CEO and Finance can view platform stats
    if (admin.role !== "ceo" && admin.role !== "finance") {
      return NextResponse.json({ success: false, error: { code: ErrorCode.FORBIDDEN, message: "Forbidden" } }, { status: 403 })
    }

    // OPTIMIZED: Combined user stats into single query
    const userStatsRow = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as total,

        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as new_today,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as new_week,
        SUM(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN 1 ELSE 0 END) as this_month,
        SUM(CASE WHEN MONTH(created_at) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH)) 
                  AND YEAR(created_at) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH)) THEN 1 ELSE 0 END) as last_month
      FROM users
    `

    const userStats = userStatsRow[0] || {}
    const totalUsers = Number(userStats.total) || 0
    const verifiedUsers = 0
    const pendingUserVerifications = 0;
    const newUsersToday = Number(userStats.new_today) || 0
    const newUsersThisWeek = Number(userStats.new_week) || 0
    const usersThisMonth = Number(userStats.this_month) || 0
    const usersLastMonth = Number(userStats.last_month) || 0
    const userGrowth = usersLastMonth > 0
      ? Math.round(((usersThisMonth - usersLastMonth) / usersLastMonth) * 100)
      : usersThisMonth > 0 ? 100 : 0

    // OPTIMIZED: Combined vehicle stats into single query
    const vehicleStatsRow = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN verification_status = 'approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN verification_status = 'pending' THEN 1 ELSE 0 END) as pending
      FROM vehicles
    `

    const vehicleStats = vehicleStatsRow[0] || {}
    const auctionVehicles = Number(vehicleStats.total) || 0
    const approvedAuctionVehicles = Number(vehicleStats.approved) || 0
    const pendingVehicleVerifications = Number(vehicleStats.pending) || 0

    // OPTIMIZED: Combined auction stats into single query
    const auctionStatsRow = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' AND end_date > NOW() THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN DATE(end_date) = CURDATE() AND status = 'active' THEN 1 ELSE 0 END) as ending_today,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as new_week,
        SUM(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN 1 ELSE 0 END) as this_month,
        SUM(CASE WHEN MONTH(created_at) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH)) 
                  AND YEAR(created_at) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH)) THEN 1 ELSE 0 END) as last_month
      FROM auctions
    `

    const auctionStats = auctionStatsRow[0] || {}
    const totalAuctions = Number(auctionStats.total) || 0
    const activeAuctions = Number(auctionStats.active) || 0
    const completedAuctions = Number(auctionStats.completed) || 0
    const auctionsEndingToday = Number(auctionStats.ending_today) || 0
    const newAuctionsThisWeek = Number(auctionStats.new_week) || 0
    const auctionsThisMonth = Number(auctionStats.this_month) || 0
    const auctionsLastMonth = Number(auctionStats.last_month) || 0
    const auctionsGrowth = auctionsLastMonth > 0
      ? Math.round(((auctionsThisMonth - auctionsLastMonth) / auctionsLastMonth) * 100)
      : auctionsThisMonth > 0 ? 100 : 0

    // OPTIMIZED: Combined bid stats into single query
    const bidStatsRow = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today,
        MAX(CASE WHEN DATE(created_at) = CURDATE() THEN amount ELSE 0 END) as highest_today,
        (SELECT AVG(bid_count) FROM (SELECT COUNT(*) as bid_count FROM bids GROUP BY auction_id) as bc) as avg_per_auction
      FROM bids
    `

    const bidStats = bidStatsRow[0] || {}
    const totalBids = Number(bidStats.total) || 0
    const bidsToday = Number(bidStats.today) || 0
    const highestBidToday = Number(bidStats.highest_today) || 0
    const avgBidsPerAuction = Math.round(Number(bidStats.avg_per_auction) || 0)

    // Top brands and cities for vehicles (keeping as separate queries since they're aggregations)
    const auctionTopBrandsRows = await prisma.$queryRaw<any[]>`
      SELECT make, COUNT(*) as count FROM vehicles 
       WHERE make IS NOT NULL AND make != ''
       GROUP BY make ORDER BY count DESC LIMIT 5
    `
    const auctionTopBrands = auctionTopBrandsRows.map((row: any) => ({
      name: row.make,
      count: Number(row.count)
    }))

    const auctionTopCitiesRows = await prisma.$queryRaw<any[]>`
      SELECT location, COUNT(*) as count FROM vehicles 
       WHERE location IS NOT NULL AND location != ''
       GROUP BY location ORDER BY count DESC LIMIT 5
    `
    const auctionTopCities = auctionTopCitiesRows.map((row: any) => ({
      name: row.location,
      count: Number(row.count)
    }))

    // OPTIMIZED: Combined showroom stats into single query
    const showroomStatsRow = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as new_today,
        SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as new_week,
        SUM(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN 1 ELSE 0 END) as this_month,
        SUM(CASE WHEN MONTH(created_at) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH)) 
                  AND YEAR(created_at) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH)) THEN 1 ELSE 0 END) as last_month
      FROM showroom
    `

    const showroomStats = showroomStatsRow[0] || {}
    const totalShowroom = Number(showroomStats.total) || 0
    const newShowroomToday = Number(showroomStats.new_today) || 0
    const newShowroomThisWeek = Number(showroomStats.new_week) || 0
    const showroomThisMonth = Number(showroomStats.this_month) || 0
    const showroomLastMonth = Number(showroomStats.last_month) || 0
    const showroomGrowth = showroomLastMonth > 0
      ? Math.round(((showroomThisMonth - showroomLastMonth) / showroomLastMonth) * 100)
      : showroomThisMonth > 0 ? 100 : 0

    // Showroom interests count
    const showroomInterestsRow = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count FROM showroom_interests
    `
    const showroomInterests = Number(showroomInterestsRow[0]?.count) || 0

    // Showroom top brands and cities
    const showroomTopBrandsRows = await prisma.$queryRaw<any[]>`
      SELECT make, COUNT(*) as count FROM showroom 
       WHERE make IS NOT NULL AND make != ''
       GROUP BY make ORDER BY count DESC LIMIT 5
    `
    const showroomTopBrands = showroomTopBrandsRows.map((row: any) => ({
      name: row.make,
      count: Number(row.count)
    }))

    const showroomTopCitiesRows = await prisma.$queryRaw<any[]>`
      SELECT location, COUNT(*) as count FROM showroom 
       WHERE location IS NOT NULL AND location != ''
       GROUP BY location ORDER BY count DESC LIMIT 5
    `
    const showroomTopCities = showroomTopCitiesRows.map((row: any) => ({
      name: row.location,
      count: Number(row.count)
    }))

    return NextResponse.json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          verified: verifiedUsers,
          newToday: newUsersToday,
          newThisWeek: newUsersThisWeek,
          growth: userGrowth,
        },
        verifications: {
          pendingUsers: pendingUserVerifications,
          pendingVehicles: pendingVehicleVerifications,
          total: pendingUserVerifications + pendingVehicleVerifications,
        },
        auctions: {
          total: totalAuctions,
          active: activeAuctions,
          completed: completedAuctions,
          endingToday: auctionsEndingToday,
          newThisWeek: newAuctionsThisWeek,
          vehicles: auctionVehicles,
          approvedVehicles: approvedAuctionVehicles,
          totalBids: totalBids,
          bidsToday: bidsToday,
          avgBidsPerAuction: avgBidsPerAuction,
          highestBidToday: highestBidToday,
          topBrands: auctionTopBrands,
          topCities: auctionTopCities,
          growth: auctionsGrowth,
        },
        showroom: {
          total: totalShowroom,
          newToday: newShowroomToday,
          newThisWeek: newShowroomThisWeek,
          interests: showroomInterests,
          topBrands: showroomTopBrands,
          topCities: showroomTopCities,
          growth: showroomGrowth,
        },
      }
    }, {
      headers: {
        'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
      },
    })
  } catch (err: any) {
    console.error("/api/admin/stats GET error:", err)
    return NextResponse.json(errorResponse(err), { status: 500 })
  }
}
