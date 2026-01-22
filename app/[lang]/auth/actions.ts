"use server"

import { headers } from "next/headers"
import { isRateLimited, RATE_LIMITS } from "@/lib/rate-limiter"

import prisma from "@/lib/prisma"
import { createToken, setAuthCookie } from "@/lib/mysql-auth"
import { validateEmail, validateUsername, validatePassword, validateUserType } from "@/lib/validations"
import { validateAndNormalizePhone } from "@/lib/phone-utils"
import { debug, info, warn, error as logError } from "@/lib/logger"
import bcrypt from "bcryptjs"
import { users_user_type } from "@prisma/client"
import { LoginSchema } from "@/lib/schemas"
import { errorResponse } from "@/lib/errors"

// --- ADDED: runtime sanity check for DB env (masked, non-sensitive) ---
const _mask = (v?: string) => {
  if (!v) return "(missing)"
  if (v.length <= 6) return v[0] + "..." + v.slice(-1)
  return v.slice(0, 2) + "..." + v.slice(-2)
}

const _requiredDb = ["DB_HOST", "DB_PORT", "DB_USER", "DB_NAME"]
const _missing = _requiredDb.filter((k) => !process.env[k])
if (_missing.length) {
  warn(`[app/auth/actions] ⚠️ Missing DB env vars: ${_missing.join(", ")}. Ensure .env.local on the server is set.`)
} else {
  info(
    `[app/auth/actions] DB env OK host=${_mask(process.env.DB_HOST)} port=${process.env.DB_PORT ?? "(unset)"} user=${_mask(
      process.env.DB_USER,
    )} name=${_mask(process.env.DB_NAME)}`,
  )
}

export async function registerUser(formData: {
  username: string
  email: string
  password: string
  confirmPassword: string
  phone_number: string
  prenom: string
  nom: string
  user_type: string
}) {
  debug("[v0 SERVER] ========== REGISTRATION ACTION STARTED ==========")

  // Rate Limiting
  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1"

  if (await isRateLimited(`auth:register:${ip}`, RATE_LIMITS.AUTH_REGISTER)) {
    warn(`[auth] Rate limit exceeded for register from ${ip}`)
    return { success: false, error: "Too many registration attempts. Please try again later." }
  }

  debug("[v0 SERVER] Received data:", {
    username: formData.username,
    email: formData.email,
    phone: formData.phone_number,
    prenom: formData.prenom,
    nom: formData.nom,
    user_type: formData.user_type,
  })

  try {
    // Validation
    const usernameValid = validateUsername(formData.username)
    if (!usernameValid.isValid) {
      return { success: false, error: usernameValid.error }
    }

    const emailValid = validateEmail(formData.email)
    if (!emailValid.isValid) {
      return { success: false, error: emailValid.error }
    }

    const passwordValid = validatePassword(formData.password)
    if (!passwordValid.isValid) {
      return { success: false, error: passwordValid.error }
    }

    if (formData.password !== formData.confirmPassword) {
      return { success: false, error: "Passwords do not match" }
    }

    // Validate and normalize phone using libphonenumber-js (Best Practice ✅)
    const phoneResult = validateAndNormalizePhone(formData.phone_number)
    if (!phoneResult.isValid) {
      return { success: false, error: phoneResult.error || "validation.phone_format" }
    }
    // Use normalized E.164 format for storage
    const normalizedPhone = phoneResult.normalized!

    // Validate user_type - only allow individual or dealer
    if (!["individual", "dealer"].includes(formData.user_type)) {
      return { success: false, error: "Invalid user type" }
    }

    debug("[v0 SERVER] ✓ Validation passed")

    debug("[v0 SERVER] Checking existing email using Prisma...")
    const existingEmail = await prisma.users.findFirst({ where: { email: formData.email } })
    if (existingEmail) {
      debug("[v0 SERVER] ❌ Email already exists:", formData.email)
      return { success: false, error: "Email already registered" }
    }
    debug("[v0 SERVER] ✓ Email available")

    debug("[v0 SERVER] Checking username availability...")
    const existingUsername = await prisma.users.findFirst({ where: { username: formData.username } })
    if (existingUsername) {
      debug("[v0 SERVER] ❌ Username already taken:", formData.username)
      return { success: false, error: "Username already taken" }
    }
    debug("[v0 SERVER] ✓ Username available")

    debug("[v0 SERVER] Creating user in database...")
    const hashedPassword = await bcrypt.hash(formData.password, 10)
    const createdUser = await prisma.users.create({
      data: {
        username: formData.username,
        email: formData.email,
        password_hash: hashedPassword,
        first_name: formData.prenom,
        last_name: formData.nom,
        phone_number: normalizedPhone, // E.164 format: +2126XXXXXXXX
        user_type: formData.user_type as users_user_type,

      }
    })
    const userId = createdUser.id
    debug("[v0 SERVER] ✓ User created with id:", userId)

    debug("[v0 SERVER] Creating JWT token...")
    const token = await createToken({ userId, email: formData.email })
    debug("[v0 SERVER] ✓ Token created")

    debug("[v0 SERVER] Setting auth cookie...")
    await setAuthCookie(token)
    debug("[v0 SERVER] ✓ Cookie set (attempted)")

    debug("[v0 SERVER] Creating welcome notification...")
    try {
      await prisma.notifications.create({
        data: {
          user_id: userId,
          title: `__t:notifications.welcome_title`,
          message: `__t:notifications.welcome_message|name=${formData.prenom}`,
          type: "info",
        }
      })
      debug("[v0 SERVER] ✓ Welcome notification created")
    } catch (notifError) {
      console.error("[v0 SERVER] ⚠️ Failed to create notification (non-critical):", notifError)
    }

    debug("[v0 SERVER] ✅ REGISTRATION COMPLETED SUCCESSFULLY")
    debug("[v0 SERVER] ========== REGISTRATION ACTION ENDED ==========")

    // User is now logged in - redirect directly to homepage
    return {
      success: true,
      userId,
      redirect: "/auth/register/success",
      token,
      user: {
        id: userId,
        email: formData.email,
        username: formData.username,
        first_name: formData.prenom,
        last_name: formData.nom,
        user_type: formData.user_type,
        profile_picture: null
      }
    }
  } catch (error) {
    const err: any = error
    logError("[v0 SERVER] ❌ CRITICAL ERROR:", err)
    console.log("[v0 SERVER] ========== REGISTRATION ACTION ENDED WITH ERROR ==========")
    return { success: false, error: "Registration failed. Please check server logs." }
  }
}

export async function loginUser(formData: { email: string; password: string }) {
  // Rate Limiting
  const headersList = await headers()
  const ip = headersList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1"

  if (await isRateLimited(`auth:login:${ip}`, RATE_LIMITS.AUTH_LOGIN)) {
    warn(`[auth] Rate limit exceeded for login from ${ip}`)
    return { success: false, error: "Too many login attempts. Please try again later." }
  }

  debug("[v0 SERVER] loginUser called for:", { email: formData.email ? formData.email : "(missing)" })
  try {
    // Validate fields with Zod
    const parsed = LoginSchema.safeParse(formData);
    if (!parsed.success) {
      return { success: false, error: parsed.error.issues[0].message }
    }

    // Find user by email or username
    const emailOrUsername = String(formData.email || "").trim()
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername }
        ]
      }
    })
    debug("[v0 SERVER] loginUser - user found:", !!user)

    if (!user) {
      debug("[v0 SERVER] loginUser - user not found for email:", formData.email)
      return { success: false, error: "Invalid email or password" }
    }

    // Normalize stored hash field
    const storedHash = user.password_hash
    if (!storedHash) {
      console.warn("[v0 SERVER] loginUser - no stored password hash for user id:", user.id)
      return { success: false, error: "Invalid email or password" }
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(formData.password, storedHash)
    debug("[v0 SERVER] loginUser - password verification result:", isValidPassword)

    if (!isValidPassword) {
      return { success: false, error: "Invalid email or password" }
    }

    // Create JWT token
    const token = await createToken({ userId: user.id, email: user.email })

    // Set auth cookie
    await setAuthCookie(token)

    debug("[v0 SERVER] loginUser - success for user id:", user.id)
    return { success: true, userId: user.id, redirect: "/", token }
  } catch (error) {
    console.error("[v0 SERVER] loginUser - unexpected error:", error)
    return { success: false, error: "Login failed. Please try again." }
  }
}

