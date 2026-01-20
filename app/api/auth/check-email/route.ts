import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { errorResponse, ErrorCode } from "@/lib/errors"
import { isRateLimited, getIp, RATE_LIMITS } from "@/lib/rate-limiter"

export async function GET(request: NextRequest) {
  const ip = getIp(request)
  if (isRateLimited(`check:email:${ip}`, RATE_LIMITS.SEARCH)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get("email")

    if (!email) {
      return NextResponse.json({ available: false, error: "Email is required" }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ available: false, error: { code: ErrorCode.VALIDATION_ERROR, message: "Invalid email format" } }, { status: 400 })
    }

    // Check if email exists in database
    const existingUser = await prisma.users.findFirst({
      where: { email: email.toLowerCase() }
    })

    return NextResponse.json({
      available: !existingUser,
      email
    })
  } catch (error) {
    console.error("[check-email] Error:", error)
    return NextResponse.json(errorResponse(error), { status: 500 })
  }
}
