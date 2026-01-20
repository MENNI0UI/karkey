import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { KarkeyCarInquirySchema } from "@/lib/schemas"
import { errorResponse, ErrorCode } from "@/lib/errors"
import { auth } from "@/auth"

// GET - Check for existing inquiry and get user info
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const karkey_car_id = searchParams.get("karkey_car_id")
        const session = await auth()
        console.log("DEBUG_API: Session:", JSON.stringify(session, null, 2))

        if (!session?.user?.id) {
            console.log("DEBUG_API: No User ID in session")
            return NextResponse.json({ userInfo: null, existingInquiry: null })
        }

        const userId = parseInt(session.user.id)
        console.log("DEBUG_API: UserID:", userId)

        // Fetch user info
        const user = await prisma.users.findUnique({
            where: { id: userId },
            select: {
                id: true,
                first_name: true,
                last_name: true,
                email: true,
                phone_number: true
            }
        })

        const userInfo = user ? {
            userId: user.id,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            phone: user.phone_number
        } : null

        let existingInquiry = null
        if (karkey_car_id) {
            existingInquiry = await prisma.karkey_car_inquiries.findFirst({
                where: {
                    karkey_car_id: parseInt(karkey_car_id),
                    user_id: userId
                }
            })
        }

        return NextResponse.json({
            userInfo,
            existingInquiry
        })

    } catch (error) {
        console.error("Error fetching inquiry status:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

// POST - Submit an inquiry for a Karkey car
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        // Validate with Zod
        const parsed = KarkeyCarInquirySchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ success: false, error: { code: ErrorCode.VALIDATION_ERROR, message: parsed.error.issues[0].message } }, { status: 400 })
        }
        const { karkey_car_id, name, phone, email, message, user_id } = parsed.data;

        // Check if car exists and is active
        const car = await prisma.karkey_cars.findFirst({
            where: { id: karkey_car_id, is_active: true },
        })

        if (!car) {
            return NextResponse.json(
                { error: "Car not found or no longer available" },
                { status: 404 }
            )
        }

        // Check for duplicate inquiry from same user/contact in last 24 hours
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
        const existingInquiry = await prisma.karkey_car_inquiries.findFirst({
            where: {
                karkey_car_id,
                OR: [
                    { user_id: user_id || undefined },
                    { email: email || undefined },
                    { phone: phone || undefined },
                ],
                created_at: { gte: oneDayAgo },
            },
        })

        if (existingInquiry) {
            return NextResponse.json(
                {
                    error: { code: ErrorCode.VALIDATION_ERROR, message: "You have already submitted an inquiry for this car" },
                    inquiry_id: existingInquiry.id,
                    created_at: existingInquiry.created_at,
                },
                { status: 409 }
            )
        }

        // Create the inquiry
        const inquiry = await prisma.karkey_car_inquiries.create({
            data: {
                karkey_car_id,
                user_id: user_id || null,
                name,
                phone: phone || null,
                email: email || null,
                message,
            },
        })

        return NextResponse.json({
            success: true,
            inquiry_id: inquiry.id,
            message: "Your inquiry has been submitted successfully",
        })
    } catch (error) {
        console.error("Error submitting Karkey car inquiry:", error)
        return NextResponse.json(errorResponse(error), { status: 500 })
    }
}
