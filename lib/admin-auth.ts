import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"

const JWT_SECRET_RAW = process.env.JWT_SECRET

if (!JWT_SECRET_RAW && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET environment variable is required in production")
}

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW || "dev-secret-change-in-prod")

export interface AdminPayload {
  id: number
  nom: string
  prenom: string
  role: string
  passwordVersion?: number
}

export async function createAdminToken(payload: AdminPayload): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET)

  return token
}

export async function verifyAdminToken(token: string): Promise<AdminPayload> {
  const { payload } = await jwtVerify(token, JWT_SECRET)
  return payload as unknown as AdminPayload
}

export async function setAdminCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  })
}

export async function getAdminFromCookie(): Promise<AdminPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("admin_token")?.value

    if (!token) {
      return null
    }

    const payload = await verifyAdminToken(token)
    return payload
  } catch (error) {
    console.error("[Admin Auth] Error getting admin from cookie:", error)
    return null
  }
}

// Verify admin session is still valid (password hasn't changed)
export async function verifyAdminSession(admin: AdminPayload): Promise<boolean> {
  try {
    const dbAdmin = await prisma.admins.findUnique({
      where: { id: admin.id },
      select: { password_version: true }
    })

    if (!dbAdmin) {
      return false
    }

    const dbPasswordVersion = dbAdmin.password_version || 1
    const tokenPasswordVersion = admin.passwordVersion || 1

    // If password_version in DB is higher than in token, session is invalid
    return dbPasswordVersion <= tokenPasswordVersion
  } catch (error) {
    console.error("[Admin Auth] Error verifying session:", error)
    return false
  }
}

export async function clearAdminCookie() {
  const cookieStore = await cookies()
  cookieStore.delete("admin_token")
}
