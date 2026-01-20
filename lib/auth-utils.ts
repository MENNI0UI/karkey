import { cookies } from "next/headers"
import { verifyToken } from "./mysql-auth"
import { auth } from "@/auth"

export async function getCurrentUser() {
  try {
    // 1. Try NextAuth first
    const session = await auth()
    if (session?.user?.id) {
      return {
        userId: Number(session.user.id),
        email: session.user.email,
      }
    }

    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return null
    }

    const payload = await verifyToken(token)
    return payload
  } catch (error) {
    console.error("[v0] Error getting current user:", error)
    return null
  }
}

export async function isAuthenticated() {
  const user = await getCurrentUser()
  return !!user
}
