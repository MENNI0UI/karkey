import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import logger from "@/lib/logger"
import { getCurrentUser } from "@/lib/mysql-auth"
import { getAdminFromCookie } from "@/lib/admin-auth"

export interface Subscription {
  id: number
  user_id: number
  plan_id: number
  status: 'pending' | 'active' | 'expired' | 'cancelled'
  start_date: string | null
  end_date: string | null
  created_at: string
  updated_at: string
  // Joined fields
  plan_name?: string
  plan_price?: number
  plan_currency?: string
  plan_duration_days?: number
  plan_bid_limit?: number | null
  plan_features?: string[]
  username?: string
  email?: string
}

/**
 * GET /api/subscriptions
 * - For users: returns their own subscription
 * - For admins: returns all subscriptions (with ?all=true or ?stats=true)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeAll = searchParams.get('all') === 'true'
    const getStats = searchParams.get('stats') === 'true'
    const userId = searchParams.get('userId')

    // Stats for CEO dashboard
    if (getStats) {
      const admin = await getAdminFromCookie()
      if (!admin) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
      }

      // Get subscription statistics using Prisma
      const totalSubs = await prisma.subscriptions.count()
      const activeSubs = await prisma.subscriptions.count({ where: { status: 'active' } })
      const pendingSubs = await prisma.subscriptions.count({ where: { status: 'pending' } })
      const expiredSubs = await prisma.subscriptions.count({ where: { status: 'expired' } })
      const cancelledSubs = await prisma.subscriptions.count({ where: { status: 'cancelled' } })

      // Revenue calculation (active subscriptions)
      const activeWithPlan = await prisma.subscriptions.findMany({
        where: { status: 'active' },
        include: { plans: true }
      })
      const monthlyRevenue = activeWithPlan.reduce((sum, s) => sum + (s.plans?.price?.toNumber() || 0), 0)

      // Subscriptions by plan
      const activePlans = await prisma.plans.findMany({
        where: { status: 'active' },
        orderBy: { priority: 'desc' }
      })
      const byPlan = await Promise.all(activePlans.map(async (p) => {
        const count = await prisma.subscriptions.count({
          where: { plan_id: p.id, status: 'active' }
        })
        return {
          plan_name: p.name,
          price: p.price,
          currency: p.currency,
          subscriber_count: count
        }
      }))

      // Recent subscriptions
      const recent = await prisma.subscriptions.findMany({
        take: 10,
        orderBy: { created_at: 'desc' },
        include: {
          plans: true,
          users: { select: { username: true, email: true } }
        }
      })
      const recentMapped = recent.map(s => ({
        ...s,
        plan_name: s.plans?.name,
        plan_price: s.plans?.price,
        plan_currency: s.plans?.currency,
        username: s.users?.username,
        email: s.users?.email
      }))

      return NextResponse.json({
        success: true,
        stats: {
          total: totalSubs,
          active: activeSubs,
          pending: pendingSubs,
          expired: expiredSubs,
          cancelled: cancelledSubs,
          monthlyRevenue,
          byPlan,
          recent: recentMapped
        }
      })
    }

    // Check if admin requesting all
    if (includeAll) {
      const admin = await getAdminFromCookie()
      if (!admin) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
      }

      // Return all subscriptions with plan and user info using Prisma
      const rows = await prisma.subscriptions.findMany({
        orderBy: { created_at: 'desc' },
        include: {
          plans: true,
          users: { select: { username: true, email: true } }
        }
      })

      const subscriptions = rows.map((row) => ({
        ...row,
        plan_name: row.plans?.name,
        plan_price: row.plans?.price,
        plan_currency: row.plans?.currency,
        plan_duration_days: row.plans?.duration_days,
        plan_bid_limit: row.plans?.bid_limit,
        plan_features: typeof row.plans?.features === 'string'
          ? JSON.parse(row.plans.features)
          : (row.plans?.features || []),
        username: row.users?.username,
        email: row.users?.email
      }))

      return NextResponse.json({ success: true, subscriptions })
    }

    // For specific user or current user
    let targetUserId: number | null = null

    if (userId) {
      // Admin checking specific user
      const admin = await getAdminFromCookie()
      if (!admin) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
      }
      targetUserId = parseInt(userId)
    } else {
      // User checking their own subscription
      const user = await getCurrentUser()
      if (!user || !user.userId) {
        return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
      }
      targetUserId = user.userId
    }

    // Get user's subscription(s) using Prisma
    const rows = await prisma.subscriptions.findMany({
      where: { user_id: targetUserId },
      orderBy: { created_at: 'desc' },
      include: { plans: true }
    })

    const subscriptions = rows.map((row) => ({
      ...row,
      plan_name: row.plans?.name,
      plan_price: row.plans?.price,
      plan_currency: row.plans?.currency,
      plan_duration_days: row.plans?.duration_days,
      plan_bid_limit: row.plans?.bid_limit,
      plan_features: typeof row.plans?.features === 'string'
        ? JSON.parse(row.plans.features)
        : (row.plans?.features || [])
    }))

    // Return active subscription as primary, all as history
    const activeSubscription = subscriptions.find((s) => s.status === 'active') || null

    return NextResponse.json({
      success: true,
      subscription: activeSubscription,
      subscriptions,
      message: activeSubscription ? undefined : "No active subscription"
    })

  } catch (err: any) {
    logger.error("/api/subscriptions GET error:", err)
    return NextResponse.json({ success: false, error: String(err?.message ?? err) }, { status: 500 })
  }
}

/**
 * POST /api/subscriptions
 * Create a new subscription for a user
 */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user || !user.userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { plan_id, billing_cycle = 'monthly' } = body

    if (!plan_id) {
      return NextResponse.json({ success: false, error: 'plan_id required' }, { status: 400 })
    }

    // Check if plan exists and is active using Prisma
    const plan = await prisma.plans.findFirst({
      where: { id: Number(plan_id), status: 'active' }
    })

    if (!plan) {
      return NextResponse.json({ success: false, error: "Plan not found or inactive" }, { status: 404 })
    }

    // Check if user already has an active subscription using Prisma
    const existingSub = await prisma.subscriptions.findFirst({
      where: { user_id: user.userId, status: 'active' }
    })

    if (existingSub) {
      return NextResponse.json({
        success: false,
        error: "You already have an active subscription. Please cancel it first or wait for it to expire."
      }, { status: 400 })
    }

    // Calculate duration based on billing cycle
    const durationDays = billing_cycle === 'annual'
      ? (plan.duration_days || 30) * 12
      : (plan.duration_days || 30)

    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + durationDays)

    // Create subscription using Prisma (status = pending until payment confirmed)
    const subscription = await prisma.subscriptions.create({
      data: {
        user_id: user.userId,
        plan_id: Number(plan_id),
        status: 'pending',
        start_date: startDate,
        end_date: endDate,
        created_at: new Date(),
        updated_at: new Date()
      }
    })

    // Create invoice record using Prisma
    const price = billing_cycle === 'annual'
      ? Math.round((plan.price?.toNumber() || 0) * 12 * 0.8) // 20% discount for annual
      : (plan.price?.toNumber() || 0)

    const invoice = await prisma.invoices.create({
      data: {
        user_id: user.userId,
        subscription_id: subscription.id,
        total: price,
        status: 'issued',
        issued_at: new Date(),
        created_at: new Date(),
        updated_at: new Date()
      }
    })

    // Payment integration placeholder:
    // Instead of marking the subscription active here, return a payment URL that
    // the client should redirect the user to. In production this should be a
    // payment provider checkout session URL or the bank's hosted payment page.
    const paymentUrl = `https://bank.example.com/checkout?invoiceId=${invoice.id}&amount=${price}&currency=${plan.currency}`

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      invoiceId: invoice.id,
      paymentUrl,
      message: "Redirect to paymentUrl to complete payment and activate subscription."
    })
  } catch (err: any) {
    logger.error('/api/subscriptions POST error:', err)
    return NextResponse.json({ success: false, error: String(err?.message ?? err) }, { status: 500 })
  }
}

/**
 * PUT /api/subscriptions
 * Update subscription status (admin) or cancel (user)
 */
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, status, action } = body

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing subscription id" }, { status: 400 })
    }

    // Check if it's a user cancellation
    if (action === 'cancel') {
      const user = await getCurrentUser()
      if (!user || !user.userId) {
        return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 })
      }

      // Verify ownership using Prisma
      const subscription = await prisma.subscriptions.findFirst({
        where: { id: Number(id), user_id: user.userId }
      })

      if (!subscription) {
        return NextResponse.json({ success: false, error: "Subscription not found" }, { status: 404 })
      }

      await prisma.subscriptions.update({
        where: { id: Number(id) },
        data: { status: 'cancelled', updated_at: new Date() }
      })

      return NextResponse.json({ success: true, message: "Subscription cancelled" })
    }

    // Admin status update
    const admin = await getAdminFromCookie()
    if (!admin || (admin.role !== 'ceo' && admin.role !== 'finance')) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    if (!status) {
      return NextResponse.json({ success: false, error: "Missing status" }, { status: 400 })
    }

    // Prevent admins from manually activating subscriptions.
    // Subscriptions should auto-activate when payment is completed.
    if (status === 'active') {
      return NextResponse.json({ success: false, error: "Admins are not allowed to activate subscriptions. Subscriptions auto-activate on payment." }, { status: 403 })
    }

    const validStatuses = ['pending', 'expired', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ success: false, error: "Invalid status" }, { status: 400 })
    }

    // Update using Prisma
    const result = await prisma.subscriptions.updateMany({
      where: { id: Number(id) },
      data: { status, updated_at: new Date() }
    })

    if (result.count === 0) {
      return NextResponse.json({ success: false, error: "Subscription not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: "Subscription updated" })

  } catch (err: any) {
    logger.error("/api/subscriptions PUT error:", err)
    return NextResponse.json({ success: false, error: String(err?.message ?? err) }, { status: 500 })
  }
}
