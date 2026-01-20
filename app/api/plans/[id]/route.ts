import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getAdminFromCookie } from "@/lib/admin-auth"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const id = Number(url.pathname.split('/').pop())
    
    const plan = await prisma.plans.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        price: true,
        currency: true,
        duration_days: true,
        bid_limit: true,
        status: true,
        created_at: true,
        updated_at: true,
      }
    })
    
    if (!plan) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, plan: { ...plan, price: plan.price ? Number(plan.price) : 0 } })
  } catch (err: unknown) {
    console.error('/api/plans/[id] GET error:', err)
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await getAdminFromCookie()
    if (!admin || (admin.role !== 'ceo' && admin.role !== 'finance')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const url = new URL(request.url)
    const id = Number(url.pathname.split('/').pop())
    const body = await request.json()
    const { name, price, currency, duration_days, bid_limit, status } = body
    
    await prisma.plans.update({
      where: { id },
      data: {
        name,
        price,
        currency,
        duration_days,
        bid_limit,
        status,
        updated_at: new Date(),
      }
    })
    
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('/api/plans/[id] PUT error:', err)
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await getAdminFromCookie()
    if (!admin || (admin.role !== 'ceo' && admin.role !== 'finance')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    const url = new URL(request.url)
    const id = Number(url.pathname.split('/').pop())
    
    await prisma.plans.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    console.error('/api/plans/[id] DELETE error:', err)
    return NextResponse.json({ success: false, error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
