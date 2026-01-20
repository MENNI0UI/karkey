import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAdminFromCookie } from "@/lib/admin-auth"
import { fallbackPlans } from "@/lib/plans-data"

/**
 * GET /api/plans
 * Public endpoint - returns active subscription plans
 * Query params:
 *   - all=true: include inactive plans (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    // Check if requesting all plans (including inactive) - for admin
    const { searchParams } = new URL(request.url)
    const includeAll = searchParams.get('all') === 'true'
    
    // Fetch plans using Prisma
    const rows = await prisma.plans.findMany({
      where: includeAll ? {} : { status: 'active' },
      orderBy: [
        { priority: 'desc' },
        { price: 'asc' }
      ]
    })
    
    // Parse features JSON for each plan and include translations
    const plans = (rows || []).map((row) => ({
      ...row,
      price: row.price?.toNumber() || 0,
      popular: !!row.popular,
      features: typeof row.features === 'string' 
        ? JSON.parse(row.features) 
        : (row.features || []),
      // Parse translated features
      features_ar: typeof row.features_ar === 'string' 
        ? JSON.parse(row.features_ar) 
        : (row.features_ar || null),
      features_fr: typeof row.features_fr === 'string' 
        ? JSON.parse(row.features_fr) 
        : (row.features_fr || null),
      features_es: typeof row.features_es === 'string' 
        ? JSON.parse(row.features_es) 
        : (row.features_es || null),
    }))
    
    // If no plans in DB, return fallback
    if (plans.length === 0) {
      return NextResponse.json({
        success: true,
        plans: fallbackPlans,
        source: 'fallback'
      })
    }
    
    return NextResponse.json({
      success: true,
      plans,
      source: 'database'
    })
    
  } catch (err: any) {
    console.error("/api/plans GET error:", err)
    
    // Return fallback plans on error so page still works
    return NextResponse.json({
      success: true,
      plans: fallbackPlans,
      source: 'fallback',
      _debug: process.env.NODE_ENV === 'development' ? String(err?.message ?? err) : undefined
    })
  }
}

/**
 * POST /api/plans
 * Admin only - create a new plan
 */
export async function POST(request: Request) {
  try {
    const admin = await getAdminFromCookie()
    if (!admin || (admin.role !== "ceo" && admin.role !== "finance")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      name, price, currency = 'DH', duration_days, bid_limit = null, 
      description = null, features = null, popular = false, priority = 0, status = 'active',
      // Translation fields
      name_ar = null, name_fr = null, name_es = null,
      description_ar = null, description_fr = null, description_es = null,
      features_ar = null, features_fr = null, features_es = null
    } = body

    if (!name || typeof price !== 'number' || !duration_days) {
      return NextResponse.json({ success: false, error: 'Missing required fields: name, price, duration_days' }, { status: 400 })
    }

    // Create plan using Prisma
    const plan = await prisma.plans.create({
      data: {
        name,
        name_ar: name_ar || null,
        name_fr: name_fr || null,
        name_es: name_es || null,
        price,
        currency,
        duration_days,
        bid_limit: bid_limit || null,
        description: description || null,
        description_ar: description_ar || null,
        description_fr: description_fr || null,
        description_es: description_es || null,
        features: features ? JSON.stringify(features) : null,
        features_ar: features_ar ? JSON.stringify(features_ar) : null,
        features_fr: features_fr ? JSON.stringify(features_fr) : null,
        features_es: features_es ? JSON.stringify(features_es) : null,
        popular: popular ? true : false,
        priority: priority || 0,
        status: status || 'active',
        created_at: new Date(),
        updated_at: new Date()
      }
    })

    return NextResponse.json({ success: true, planId: plan.id })
  } catch (err: any) {
    console.error("/api/plans POST error:", err)
    return NextResponse.json({ success: false, error: String(err?.message ?? err) }, { status: 500 })
  }
}

/**
 * PUT /api/plans
 * Admin only - update an existing plan
 */
export async function PUT(request: Request) {
  try {
    const admin = await getAdminFromCookie()
    if (!admin || (admin.role !== "ceo" && admin.role !== "finance")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { 
      id, name, price, currency, duration_days, bid_limit, description, features, popular, priority, status,
      // Translation fields
      name_ar, name_fr, name_es,
      description_ar, description_fr, description_es,
      features_ar, features_fr, features_es
    } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing plan id' }, { status: 400 })
    }

    // Build dynamic update data for Prisma
    const updateData: Record<string, any> = { updated_at: new Date() }
    
    if (name !== undefined) updateData.name = name
    if (name_ar !== undefined) updateData.name_ar = name_ar
    if (name_fr !== undefined) updateData.name_fr = name_fr
    if (name_es !== undefined) updateData.name_es = name_es
    if (price !== undefined) updateData.price = price
    if (currency !== undefined) updateData.currency = currency
    if (duration_days !== undefined) updateData.duration_days = duration_days
    if (bid_limit !== undefined) updateData.bid_limit = bid_limit
    if (description !== undefined) updateData.description = description
    if (description_ar !== undefined) updateData.description_ar = description_ar
    if (description_fr !== undefined) updateData.description_fr = description_fr
    if (description_es !== undefined) updateData.description_es = description_es
    if (features !== undefined) updateData.features = JSON.stringify(features)
    if (features_ar !== undefined) updateData.features_ar = JSON.stringify(features_ar)
    if (features_fr !== undefined) updateData.features_fr = JSON.stringify(features_fr)
    if (features_es !== undefined) updateData.features_es = JSON.stringify(features_es)
    if (popular !== undefined) updateData.popular = popular ? true : false
    if (priority !== undefined) updateData.priority = priority
    if (status !== undefined) updateData.status = status
    
    if (Object.keys(updateData).length === 1) { // Only updated_at
      return NextResponse.json({ success: false, error: 'No fields to update' }, { status: 400 })
    }
    
    // Update using Prisma
    const result = await prisma.plans.updateMany({
      where: { id: Number(id) },
      data: updateData
    })
    
    if (result.count === 0) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Plan updated successfully' })
  } catch (err: any) {
    console.error("/api/plans PUT error:", err)
    return NextResponse.json({ success: false, error: String(err?.message ?? err) }, { status: 500 })
  }
}

/**
 * DELETE /api/plans
 * Admin only - deactivate or permanently delete a plan
 * Query params:
 *   - id: plan id (required)
 *   - permanent=true: permanently delete (hard delete), otherwise soft delete (deactivate)
 */
export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAdminFromCookie()
    if (!admin || (admin.role !== "ceo" && admin.role !== "finance")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const permanent = searchParams.get('permanent') === 'true'

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing plan id' }, { status: 400 })
    }

    let result: { count: number }
    
    if (permanent) {
      // Hard delete - permanently remove from database using Prisma
      result = await prisma.plans.deleteMany({
        where: { id: Number(id) }
      })
    } else {
      // Soft delete - set status to inactive using Prisma
      result = await prisma.plans.updateMany({
        where: { id: Number(id) },
        data: { status: 'inactive', updated_at: new Date() }
      })
    }
    
    if (result.count === 0) {
      return NextResponse.json({ success: false, error: 'Plan not found' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true, 
      message: permanent ? 'Plan permanently deleted' : 'Plan deactivated successfully' 
    })
  } catch (err: any) {
    console.error("/api/plans DELETE error:", err)
    return NextResponse.json({ success: false, error: String(err?.message ?? err) }, { status: 500 })
  }
}
