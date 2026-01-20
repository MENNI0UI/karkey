import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                console.log("DEBUG_AUTH: Authorize called with:", credentials?.email)
                if (!credentials?.email || !credentials?.password) return null

                const user = await prisma.users.findUnique({
                    where: { email: credentials.email as string }
                })
                console.log("DEBUG_AUTH: User found:", !!user)

                if (!user || !user.password_hash) return null

                const isValid = await bcrypt.compare(credentials.password as string, user.password_hash)
                console.log("DEBUG_AUTH: Password valid:", isValid)
                if (!isValid) return null

                return {
                    id: String(user.id),
                    email: user.email,
                    name: [user.first_name, user.last_name].filter(Boolean).join(" "),
                    phone: user.phone_number,
                }
            }
        })
    ],
    session: {
        strategy: "jwt",
        maxAge: 24 * 60 * 60, // 24 hours - session expires after 1 day
        updateAge: 60 * 60, // 1 hour - refresh session every hour if user is active
    },
    trustHost: true,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    callbacks: {
        async jwt({ token, user, trigger, session }) {
            console.log("DEBUG_AUTH: JWT Callback", { trigger, token_id: token.id, user_id: user?.id })
            if (user) {
                token.id = user.id;
                token.name = user.name;
                token.email = user.email;
                token.phone = (user as any).phone;
            }
            return token;
        },
        async session({ session, token }) {
            console.log("DEBUG_AUTH: Session Callback", { session_user_id: session?.user?.id, token_id: token?.id })
            if (session.user && token.id) {
                session.user.id = token.id as string;
                session.user.name = token.name as string;
                session.user.email = token.email as string;
                (session.user as any).phone = token.phone as string;
            }
            return session;
        }
    },
    pages: {
        signIn: "/auth/login",
    }
})
