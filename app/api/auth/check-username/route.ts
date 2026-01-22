import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { errorResponse, ErrorCode } from "@/lib/errors"
import { isRateLimited, getIp, RATE_LIMITS } from "@/lib/rate-limiter"

export async function GET(request: NextRequest) {
  const ip = getIp(request)
  if (await isRateLimited(`check:username:${ip}`, RATE_LIMITS.SEARCH)) { // Reuse SEARCH limit (30/min)
    return NextResponse.json({ error: "Too many requests" }, { status: 429 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const username = searchParams.get("username")

    if (!username) {
      return NextResponse.json({ available: false, error: "Username is required" }, { status: 400 })
    }

    // Validate username format
    const usernameRegex = /^\w{3,20}$/
    if (!usernameRegex.test(username)) {
      return NextResponse.json({ available: false, error: { code: ErrorCode.VALIDATION_ERROR, message: "Invalid username format" } }, { status: 400 })
    }

    // Check if username exists in database
    const existingUser = await prisma.users.findFirst({
      where: { username: username.toLowerCase() }
    })

    return NextResponse.json({
      available: !existingUser,
      username
    })
  } catch (error) {
    console.error("[check-username] Error:", error)
    return NextResponse.json(errorResponse(error), { status: 500 })
  }
}
