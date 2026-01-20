import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { revalidateTag } from "next/cache"
import { z } from "zod"
import { errorResponse, ErrorCode } from "@/lib/errors"

const VerifySchema = z.object({
  vehicleId: z.coerce.number().int().positive("Vehicle ID is required"),
  newStatus: z.enum(['pending', 'approved', 'rejected']),
});

// 🆕 النظام الجديد: يستخدم direct_sales بدلاً من vehicles/auctions القديمة
// This route is kept for backward compatibility, redirects to direct_sales
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    // Validate input
    const parsed = VerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({
        success: false,
        error: { code: ErrorCode.VALIDATION_ERROR, message: "Invalid input", details: parsed.error.flatten() }
      }, { status: 400 })
    }

    const { vehicleId, newStatus } = parsed.data;

    // 🆕 Update direct_sale status (vehicleId is now direct_sale id)
    await prisma.direct_sales.update({
      where: { id: vehicleId },
      data: { 
        verification_status: newStatus as any, // enum: pending, approved, rejected
      },
    })

    // If approved and it's an auction, activate it
    if (newStatus === "approved") {
      const directSale = await prisma.direct_sales.findUnique({
        where: { id: vehicleId }
      })

      if (directSale?.auction_mode) {
        const now = new Date()
        const endDate = new Date(now)
        // Use 7 days default if no duration set
        endDate.setDate(endDate.getDate() + 7)

        await prisma.direct_sales.update({
          where: { id: vehicleId },
          data: {
            auction_status: "active",
            auction_start_date: now,
            auction_end_date: endDate
          }
        })
      }
    }

    // Trigger ISR revalidation
    revalidateTag("vehicles");
    revalidateTag("auctions");
    revalidateTag("filters");
    revalidateTag("direct-sales");

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[admin/vehicles/verify] error:", error);
    return NextResponse.json(errorResponse(error), { status: 500 })
  }
}
