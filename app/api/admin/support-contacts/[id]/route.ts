import { NextResponse } from "next/server"
import { getAdminFromCookie } from "@/lib/admin-auth"
import prisma from "@/lib/prisma"
import { error as logError } from "@/lib/logger"
import { SupportContactUpdateSchema } from "@/lib/schemas"
import { errorResponse, ErrorCode } from "@/lib/errors"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminFromCookie()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: idParam } = await params
    const id = Number(idParam)
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    const body = await request.json().catch(() => ({}))
    const parsed = SupportContactUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: { code: ErrorCode.VALIDATION_ERROR, message: parsed.error.issues[0].message } }, { status: 400 })
    }
    const processed = parsed.data.processed;

    await prisma.direct_sales_contacts.update({
      where: { id },
      data: { processed }
    })

    // Broadcast to any connected admin SSE clients so other admin UIs update immediately
    try {
      const MAP_KEY = "__ADMIN_SSE_MAP"
      const set = (globalThis as { [key: string]: unknown })[MAP_KEY] as Set<{ controller: ReadableStreamDefaultController }> | undefined
      if (set && set.size > 0) {
        const encoder = new TextEncoder()
        const payload = JSON.stringify({ type: 'contact:update', id, processed })
        for (const entry of Array.from(set)) {
          try { entry.controller.enqueue(encoder.encode(`data: ${payload}\n\n`)) } catch { }
        }
      }
    } catch { }

    return NextResponse.json({ success: true })
  } catch (err) {
    logError('[admin support contacts PATCH] Error:', err)
    return NextResponse.json(errorResponse(err), { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminFromCookie()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: idParam } = await params
    const id = Number(idParam)
    if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

    await prisma.direct_sales_contacts.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    logError('[admin support contacts DELETE] Error:', err)
    return NextResponse.json(errorResponse(err), { status: 500 })
  }
}
