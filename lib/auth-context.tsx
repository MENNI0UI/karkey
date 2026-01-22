"use client"
import React from "react"

import { useSession, signOut } from "next-auth/react"

export type AuthContextShape = {
	readonly user: any | null
	readonly currentUserId: number | null
	setUser: (u: any | null) => void
	login: (token: string, user?: any) => Promise<void>
	logout: () => Promise<void>
	isLoaded: boolean
}

const AuthContext = React.createContext<AuthContextShape | undefined>(undefined)

export function AuthProvider({ children }: { readonly children: React.ReactNode }) {
	const { data: session, status } = useSession()
	const [user, setUser] = React.useState<any | null>(null)

	React.useEffect(() => {
		if (status === "authenticated" && session?.user) {
			setUser(session.user)
		} else if (status === "unauthenticated") {
			setUser(null)
		}
	}, [session, status])

	const login = React.useCallback(async (token: string, u?: any) => {
		// Compatibility wrapper - in unified system, we use signIn()
		if (u) setUser(u)
	}, [])

	const logout = React.useCallback(async () => {
		try {
			// Clear React state first for immediate UI response
			setUser(null)

			// Call signOut from next-auth/react
			// We use redirect: false to allow the global logout handler to control the final redirect
			// but we handle the promise to ensure it attempt to clear the server session
			await signOut({ redirect: false, callbackUrl: "/" })

			if (typeof globalThis.window !== "undefined") {
				// Clear tokens and metadata
				localStorage.removeItem("auth_token")
				localStorage.removeItem("auth_profile_picture")
				localStorage.removeItem("auth_profile_userid")
				localStorage.setItem("auth:disabled", "1")
				localStorage.setItem("auth:logout", String(Date.now()))
			}
		} catch (e) {
			console.error("[AuthContext] logout error:", e)
			// Fallback: force redirect if programmatic logout fails
			if (typeof globalThis.window !== "undefined") {
				globalThis.window.location.href = "/"
			}
		}
	}, [])

	const isLoaded = status !== "loading"

	// Compute currentUserId from user data
	const currentUserId = React.useMemo(() => {
		if (!user) return null
		const id = user.id ?? user.userId ?? user.user_id
		return id ? Number(id) : null
	}, [user])

	const value = React.useMemo(() => ({ user, currentUserId, setUser, login, logout, isLoaded }), [user, currentUserId, login, logout, isLoaded])
	return (
		<AuthContext.Provider value={value}>
			{children}
		</AuthContext.Provider>
	)
}

export function useAuth() {
	const ctx = React.useContext(AuthContext)
	if (!ctx) throw new Error("useAuth must be used inside AuthProvider")
	return ctx
}
