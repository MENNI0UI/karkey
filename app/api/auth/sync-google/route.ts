
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { createToken } from "@/lib/mysql-auth"
import { cookies } from "next/headers"

export async function GET(req: NextRequest) {
    try {
        // 1. Get session from NextAuth
        const session = await auth()
        
        if (!session?.user?.email) {
            console.error("[GoogleSync] No session or email found")
            return redirectToLogin(req, "no_session")
        }

        const userEmail = session.user.email
        console.log("[GoogleSync] Processing user:", userEmail)

        // 2. Find user in database
        const user = await prisma.users.findUnique({
            where: { email: userEmail }
        })

        if (!user) {
            console.error("[GoogleSync] User not found:", userEmail)
            return redirectToLogin(req, "user_not_found")
        }

        // 3. Create our app's JWT token
        const token = await createToken({ userId: user.id, email: user.email })

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

        console.log("[GoogleSync] User authenticated, redirecting to:", finalUrl)

        // 6. Set cookie and redirect
        const response = NextResponse.redirect(finalUrl)
        response.cookies.set("auth_token", token, {
            path: "/",
            httpOnly: true,
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 days
            secure: isSecure,
        })

        return response

    } catch (error) {
        console.error("[GoogleSync] Error:", error)
        return redirectToLogin(req, "sync_failed")
    }
}

function redirectToLogin(req: NextRequest, error: string) {
    const lang = req.cookies.get("karkey:lang")?.value || "en"
    return NextResponse.redirect(new URL(`/${lang}/auth/login?error=${error}`, req.url))
}
