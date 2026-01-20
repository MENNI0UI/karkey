"use server"

import prisma from "@/lib/prisma"
import { getAdminFromCookie } from "@/lib/admin-auth"

export async function getUserProfile(userId: number) {
  const admin = await getAdminFromCookie()
  if (!admin) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        user_type: true,
        created_at: true,
        updated_at: true
      }
    })

    if (!user) {
      return { success: false, error: "User not found" }
    }

    // Normalize data types for client component
    return {
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        first_name: user.first_name ?? "",
        last_name: user.last_name ?? "",
        phone_number: user.phone_number,
        user_type: String(user.user_type),
        created_at: user.created_at.toISOString(),
        updated_at: user.updated_at.toISOString()
      }
    }
  } catch (error) {
    console.error("[v0] Error getting user profile:", error)
    return { success: false, error: "Failed to get user profile" }
  }
}
