"use server";

import { SignJWT, jwtVerify, type JWTPayload } from "jose"
import { hashPassword as bcryptHash, verifyPassword as bcryptVerify } from "./auth"
import { cookies as nextCookies, headers } from "next/headers"

// Use a stable Uint8Array secret for jose
const JWT_SECRET_RAW = process.env.JWT_SECRET

// Prevent using weak default secret in production
if (!JWT_SECRET_RAW && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET environment variable is required in production")
}

const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_RAW || "dev-secret-change-in-prod")

// Hash password using bcrypt wrapper
export async function hashPassword(password: string): Promise<string> {
  return await bcryptHash(password)
}

// Verify password using bcrypt wrapper
export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return await bcryptVerify(plainPassword, hashedPassword)
}

// Create JWT token (HS256)
export async function createToken(payload: { userId: number; email: string }): Promise<string> {
  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET)
  return token
}

// Verify JWT token and return typed payload or null
export async function verifyToken(token: string): Promise<{ userId: number; email: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    // payload may contain extra fields; assert expected ones
    const p = payload as JWTPayload & { userId?: number; email?: string }
    if (!p || (!p.email && !p.userId)) return null
    return { userId: Number(p.userId) || 0, email: String(p.email || "") }
  } catch {
    return null
  }
}

// Set authentication cookie (server-side). Use next/headers cookies()
export async function setAuthCookie(token: string, options?: { maxAge?: number }) {
  // guard to ensure server-only usage
  if (typeof window !== "undefined") throw new Error("setAuthCookie() can only be used on the server")
  try {
    const maxAge = options?.maxAge ?? 60 * 60 * 24 * 30 // 30 days
    const headerStore = await headers()
    const hostHeader = headerStore.get("host") ?? ""
    const host = String(hostHeader).split(":")[0] || ""
    const isLocalhost = host.startsWith("localhost") || host === "127.0.0.1"
    const isIPAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(host)

    const secure = process.env.NODE_ENV === "production" && !isLocalhost && !isIPAddress

    const store = await nextCookies()
    store.set({
      name: "auth_token",
      value: token,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure,
      maxAge,
    })
    // optional debug
    console.log("[mysql-auth] set auth_token cookie length:", token ? token.length : 0)
  } catch (e) {
    console.error("[mysql-auth] Failed to set auth cookie:", e)
    throw e
  }
}

// Get authentication cookie value (server-side)
export async function getAuthCookie(): Promise<string | undefined> {
  if (typeof window !== "undefined") throw new Error("getAuthCookie() can only be used on the server")
  try {
    const store = await nextCookies()
    return store.get("auth_token")?.value ?? store.get("auth:token")?.value
  } catch {
    return undefined
  }
}

// Remove authentication cookie (server-side)
export async function removeAuthCookie() {
  if (typeof window !== "undefined") throw new Error("removeAuthCookie() can only be used on the server")
  try {
    const store = await nextCookies()
    store.delete("auth_token")
    store.delete("auth:token")
  } catch (err) {
    console.error("[mysql-auth] Failed to delete auth cookie:", err)
  }
}

// Get current user payload from cookie (server-side)
// Refactored to use NextAuth for unified session management
export async function getCurrentUser() {
  try {
    const { auth } = await import("@/auth")
    const session = await auth()
    if (!session?.user) {
      // Fallback: check legacy cookie if NextAuth session doesn't exist yet
      const token = await getAuthCookie()
      if (token) {
        const payload = await verifyToken(token)
        return payload
      }
      return null
    }
    return {
      userId: Number(session.user.id),
      email: session.user.email || ""
    }
  } catch {
    return null
  }
}

// Get DB connection helper for server code that needs direct access
// Now uses Prisma directly instead of legacy mysql2 pool with eval()
export async function getConnection() {
  // guard: this helper must only run on the server
  if (typeof window !== "undefined") {
    throw new Error("getConnection() can only be used on the server")
  }

  // Import Prisma client - no need for eval() hack
  const { default: prisma } = await import("./prisma")
  return prisma
}
