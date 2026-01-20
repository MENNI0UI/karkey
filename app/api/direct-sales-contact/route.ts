import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { error as logError } from "@/lib/logger"
import { getCurrentUser } from "@/lib/mysql-auth"
import { DirectSaleContactSchema } from "@/lib/schemas"
import { errorResponse, ErrorCode } from "@/lib/errors"

// GET: Check if user already submitted a contact request for this listing + get user info
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const direct_sale_id = Number(url.searchParams.get("direct_sale_id") || 0)

    if (!direct_sale_id) return NextResponse.json({ error: "Missing direct_sale_id" }, { status: 400 })

    // Get current user info
    let userInfo: { userId: number; firstName?: string; lastName?: string; email?: string; phone?: string } | null = null
    let existingRequest: any = null

    try {
      const session = await getCurrentUser()
      if (session && session.userId) {
        // Get user details using Prisma
        const user = await prisma.users.findUnique({
          where: { id: session.userId },
          select: {
            id: true,
            first_name: true,
            last_name: true,
            email: true,
            phone_number: true
          }
        })

        if (user) {
          userInfo = {
            userId: user.id,
            firstName: user.first_name || "",
            lastName: user.last_name || "",
            email: user.email || "",
            phone: user.phone_number || ""
          }
        }

        // Check for existing contact request using Prisma
        const existing = await prisma.direct_sales_contacts.findFirst({
          where: {
            direct_sale_id,
            user_id: session.userId
          },
          orderBy: { created_at: 'desc' }
        })

        if (existing) {
          existingRequest = existing
        }
      }
    } catch { /* guest user */ }

    return NextResponse.json({
      success: true,
      userInfo,
      existingRequest: existingRequest ? {
        ...existingRequest,
        id: existingRequest.id.toString(),
        direct_sale_id: existingRequest.direct_sale_id.toString(),
        user_id: existingRequest.user_id?.toString()
      } : null
    })
  } catch (err) {
    logError('[direct-sales-contact GET] Error:', err)
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}))

    // Validate with Zod
    const parsed = DirectSaleContactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: { code: ErrorCode.VALIDATION_ERROR, message: parsed.error.issues[0].message } }, { status: 400 })
    }
    const { direct_sale_id, name, email, phone, message } = parsed.data;

    // Get user_id from session if authenticated
    let userId: number | null = null
    try {
      const user = await getCurrentUser()
      if (user && user.userId) {
        userId = Number(user.userId)
      }
    } catch { /* guest user */ }

    // Check for duplicate request (same user + same listing) using Prisma
    if (userId) {
      const existing = await prisma.direct_sales_contacts.findFirst({
        where: {
          direct_sale_id,
          user_id: userId
        }
      })

      if (existing) {
        return NextResponse.json({ error: { code: ErrorCode.VALIDATION_ERROR, message: "You have already submitted a contact request for this listing" }, duplicate: true }, { status: 409 })
      }
    }

    // Insert contact request using Prisma
    const newContact = await prisma.direct_sales_contacts.create({
      data: {
        direct_sale_id,
        user_id: userId,
        name,
        email,
        phone,
        message,
        processed: false
      }
    })

    return NextResponse.json({ success: true, id: newContact.id.toString() })
  } catch (err) {
    logError('[direct-sales-contact] Error:', err)
    return NextResponse.json(errorResponse(err), { status: 500 })
  }
}
