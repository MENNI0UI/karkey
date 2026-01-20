import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth-utils"
import prisma from "@/lib/prisma"

export async function GET() {
  try {
    const user = await getCurrentUser()

    if (user) {
      try {
        // Fetch profile picture using Prisma
        const userData = await prisma.users.findUnique({
          where: { id: user.userId },
          select: { profile_picture: true }
        })

        const profilePicture = userData?.profile_picture || null

        return NextResponse.json({
          isAuthenticated: true,
          email: user.email,
          userId: user.userId,
          profilePicture: profilePicture,
        })
      } catch (dbError) {
        console.error("[v0] Error fetching profile picture:", dbError)
        // Return without profile picture if query fails
        return NextResponse.json({
          isAuthenticated: true,
          email: user.email,
          userId: user.userId,
          profilePicture: null,
        })
      }
    }

    return NextResponse.json({ isAuthenticated: false })
  } catch (error) {
    console.error("[v0] Error checking auth:", error)
    return NextResponse.json({ isAuthenticated: false })
  }
}
