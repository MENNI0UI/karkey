import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getCurrentUser } from "@/lib/mysql-auth"
import { getAdminFromCookie } from "@/lib/admin-auth"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const id = Number(url.pathname.split('/').pop())
    
    const admin = await getAdminFromCookie()
    if (admin) {
      const sub = await prisma.subscriptions.findUnique({
        where: { id }
      })
      if (!sub) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
      return NextResponse.json({ success: true, subscription: sub })
    }

    const user = await getCurrentUser()
    if (!user || !user.userId) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    
    const sub = await prisma.subscriptions.findFirst({
      where: { id, user_id: user.userId }
    })
    if (!sub) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, subscription: sub })
  } catch (err: any) {
    console.error('/api/subscriptions/[id] GET error:', err)
    return NextResponse.json({ success: false, error: String(err?.message ?? err) }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const admin = await getAdminFromCookie()
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    
    const url = new URL(request.url)
    const id = Number(url.pathname.split('/').pop())
    const body = await request.json()
    const { status, start_date, end_date } = body
    
    await prisma.subscriptions.update({
      where: { id },
      data: {
        status: status || 'active',
        start_date: start_date ? new Date(start_date) : null,
        end_date: end_date ? new Date(end_date) : null,
        updated_at: new Date()
      }
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('/api/subscriptions/[id] PUT error:', err)
    return NextResponse.json({ success: false, error: String(err?.message ?? err) }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await getAdminFromCookie()
    if (!admin) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    
    const url = new URL(request.url)
    const id = Number(url.pathname.split('/').pop())
    
    await prisma.subscriptions.delete({
      where: { id }
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('/api/subscriptions/[id] DELETE error:', err)
    return NextResponse.json({ success: false, error: String(err?.message ?? err) }, { status: 500 })
  }
}
