
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { cookies } from "next/headers"
import logger from "@/lib/logger"

export async function GET(req: NextRequest) {
    try {
        // 1. Get session from NextAuth
        const session = await auth()

        if (!session?.user?.email) {
            logger.error("[GoogleSync] No session or email found")
            return redirectToLogin(req, "no_session")
        }

        const userEmail = session.user.email
        logger.info("[GoogleSync] Processing user:", userEmail)

        // 2. Find user in database
        const user = await prisma.users.findUnique({
            where: { email: userEmail }
        })

        if (!user) {
            logger.error("[GoogleSync] User not found:", userEmail)
            return redirectToLogin(req, "user_not_found")
        }

        // Legacy Token Generation Removed - NextAuth Session is Sufficient

        // 4. Get language preference
        const cookieStore = await cookies()
        const lang = cookieStore.get("karkey:lang")?.value || "en"

        // 5. Determine redirect path
        const baseUrl = (process.env.AUTH_URL || req.nextUrl.origin).replace(/\/$/, "")
        const redirectPath = user.is_profile_complete
            ? `/${lang}`
            : `/${lang}/auth/complete-profile`

        const finalUrl = `${baseUrl}${redirectPath}`
        const isSecure = baseUrl.startsWith("https://")

        logger.info("[GoogleSync] User authenticated, redirecting to:", finalUrl)

        // 6. Redirect (Session matches)
        return NextResponse.redirect(finalUrl)

    } catch (error) {
        logger.error("[GoogleSync] Error:", error)
        return redirectToLogin(req, "sync_failed")
    }
}

function redirectToLogin(req: NextRequest, error: string) {
    const lang = req.cookies.get("karkey:lang")?.value || "en"
    return NextResponse.redirect(new URL(`/${lang}/auth/login?error=${error}`, req.url))
}
