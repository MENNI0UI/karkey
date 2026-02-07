"use client"
import React, { useEffect, useRef, useState, useMemo } from "react"
import NotificationActionButton from "@/components/layout/notification-action-button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslation } from "@/lib/i18n-context"
import { ChatBubble } from "@/components/chat"

interface MainLayoutProps {
	children: React.ReactNode
	isLoggedIn?: boolean
	email?: string
	profilePicture?: string
	hideHeaderFooter?: boolean
}

export function MainLayout({ children, isLoggedIn, email, profilePicture, hideHeaderFooter }: MainLayoutProps) {
	const pathname = usePathname() || "/"
	const { t, language } = useTranslation()
	const [notifications, setNotifications] = useState<any[]>([])
	const [unreadCount, setUnreadCount] = useState(0)
	const [dropdownOpen, setDropdownOpen] = useState(false)
	const fetchRef = useRef<() => Promise<void> | null>(null)
	const dropdownRef = useRef<HTMLDivElement | null>(null)

	// Helper to translate notification text that may contain translation keys
	const translateText = (text: string): string => {
		if (!text || !text.startsWith("__t:")) return text
		try {
			const parts = text.slice(4).split("|")
			const key = parts[0]
			const params: Record<string, string> = {}
			for (let i = 1; i < parts.length; i++) {
				const [k, v] = parts[i].split("=")
				if (k && v) params[k] = v
			}
			let translated = t(key as any)
			Object.entries(params).forEach(([k, v]) => {
				translated = translated.replace(`{${k}}`, v)
			})
			return translated
		} catch {
			return text
		}
	}

	// Show a full-screen loading overlay on initial request/refresh.
	// initialLoading defaults to true so the overlay is present in the SSR HTML;
	// after hydration the effect runs and hides the overlay (smooth fade).
	const [initialLoading, setInitialLoading] = useState(true)
	useEffect(() => {
		// hide after mount (hydration complete)
		const t = window.setTimeout(() => setInitialLoading(false), 2000) // 2 seconds for demo
		return () => window.clearTimeout(t)
	}, [])

	// Hide header/footer for auth pages and auction details page
	const shouldHideHeaderFooter =
		hideHeaderFooter ||
		pathname.startsWith("/auth/register") ||
		pathname.startsWith("/auth/login") ||
		// hide main site header on admin routes so admin pages render their own layout
		pathname.startsWith("/admin") ||
		/^\/auctions\/[^/]+$/.test(pathname)

	// canonical fetch used by multiple places
	async function fetchNotificationsCanonical() {
		try {
			const res = await fetch("/api/notifications/me", { cache: "no-store", credentials: "include" })
			if (!res.ok) return
			const data = await res.json()
			const list = Array.isArray(data.notifications) ? data.notifications : []
			setNotifications(list)
			setUnreadCount(list.filter((n: any) => !n.is_read).length)
			// notify other listeners
			window.dispatchEvent(new CustomEvent("notifications:updated", { detail: { notifications: list, unreadCount: list.filter((n: any) => !n.is_read).length } }))
		} catch {
			// ignore
		}
	}

	// expose fetch routine to other code
	useEffect(() => {
		// fetchRef is declared as RefObject but we intentionally assign a function for external callers.
		// @ts-expect-error allow assignment to fetchRef.current
		fetchRef.current = fetchNotificationsCanonical
		return () => {
			// @ts-expect-error allow nulling the ref
			fetchRef.current = null
		}
	}, [])

	// initial poll + periodic refresh + event listener
	useEffect(() => {
		let mounted = true
		let intervalId: number | null = null
		let inFlight = false

		const runFetch = async () => {
			if (inFlight) return
			inFlight = true
			try {
				await fetchNotificationsCanonical()
			} finally {
				inFlight = false
			}
		}

		// initial canonical fetch
		void runFetch()

		// poll less frequently (60s) and pause when tab is hidden
		const startPolling = () => {
			if (intervalId != null) return
			intervalId = window.setInterval(() => {
				if (!mounted || document.hidden) return
				void runFetch()
			}, 300000) as unknown as number
		}
		const stopPolling = () => {
			if (intervalId != null) {
				try { window.clearInterval(intervalId) } catch { }
				intervalId = null
			}
		}

		const onVisibility = () => {
			if (document.hidden) stopPolling()
			else startPolling()
		}

		startPolling()
		document.addEventListener("visibilitychange", onVisibility)

		const onExternal = (e: Event) => {
			try {
				const detail = (e as CustomEvent)?.detail
				if (detail && typeof detail.unreadCount === "number") setUnreadCount(detail.unreadCount)
				if (detail && Array.isArray(detail.notifications)) setNotifications(detail.notifications)
				// one-off canonical sync
				void runFetch()
			} catch { }
		}
		window.addEventListener("notifications:updated", onExternal)

		return () => {
			mounted = false
			stopPolling()
			document.removeEventListener("visibilitychange", onVisibility)
			window.removeEventListener("notifications:updated", onExternal)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	// SSE best-effort: open stream and re-sync canonical state on messages
	useEffect(() => {
		let es: EventSource | null = null
		try {
			es = new EventSource("/api/notifications/stream")
		} catch {
			es = null
		}
		if (!es) return

		es.onmessage = async (ev) => {
			// try to re-fetch canonical immediately
			try {
				await fetchNotificationsCanonical()
			} catch {
				// fallback: optimistic prepend if payload provided
				try {
					const parsed = JSON.parse(ev.data)
					const n = parsed?.notification
					if (n) {
						setNotifications((prev) => {
							const exists = prev.some((x) => String(x.id) === String(n.id))
							const next = exists ? prev : [n, ...prev]
							const unread = next.filter((m: any) => !m.is_read).length
							window.dispatchEvent(new CustomEvent("notifications:updated", { detail: { notifications: next, unreadCount: unread } }))
							return next
						})
						setUnreadCount((c) => c + 1)
					}
				} catch {
					// ignore
				}
			}
		}

		es.onerror = async () => {
			// attempt one canonical sync then close
			try { await fetchNotificationsCanonical() } catch { }
			try { es?.close() } catch { }
			es = null
		}

		return () => {
			try { es?.close() } catch { }
			es = null
		}
	}, [])

	// mark as read helpers
	async function markAsRead(id: number) {
		try {
			await fetch("/api/notifications", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ action: "markAsRead", notificationId: id }),
			})
		} catch {
			// ignore
		} finally {
			void fetchNotificationsCanonical()
		}
	}
	async function markAllAsRead() {
		try {
			await fetch("/api/notifications", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ action: "markAllAsRead" }),
			})
		} catch {
			// ignore
		} finally {
			void fetchNotificationsCanonical()
		}
	}

	// close dropdown on outside click
	useEffect(() => {
		function onDoc(e: MouseEvent) {
			if (!dropdownOpen) return
			if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false)
		}
		document.addEventListener("mousedown", onDoc)
		return () => document.removeEventListener("mousedown", onDoc)
	}, [dropdownOpen])

	return (
		<div className="main-layout-root">
			{/* Fullscreen loading overlay */}
			{initialLoading && (
				<div className="fixed inset-0 z-[99999] flex items-center justify-center bg-white">
					<div className="flex flex-col items-center gap-4">
						<div className="w-14 h-14 rounded-full border-4 border-[#d9c38b] border-t-transparent animate-spin" />
						<div className="text-lg text-[#717171] font-semibold">Loading…</div>
					</div>
				</div>
			)}

			{/* Main Header */}
			{!shouldHideHeaderFooter && (
				<header className="fixed top-0 inset-x-0 z-50 bg-[#fffdf8] border-b border-[#d9c38b]">
					<div className="max-w-7xl mx-auto px-6">
						<div className="flex items-center justify-between h-20">
							<Link href="/" className="text-2xl font-bold text-[#c5a05e] hover:text-[#103090] transition-colors">Karkey</Link>

							<nav className="hidden md:flex items-center space-x-8">
								<Link href="/auctions" className="text-[#717171] hover:text-[#103090] font-medium">Auctions</Link>
								<Link href="/direct-sales" className="text-[#717171] hover:text-[#103090] font-medium">Direct Sales</Link>
								<Link href="/about" className="text-[#717171] hover:text-[#103090] font-medium">About</Link>
							</nav>

							<div className="flex items-center space-x-4">
								{isLoggedIn ? (
									<>
										<span className="text-sm text-[#717171]">{email}</span>

										<div className="relative" ref={dropdownRef}>
											<button
												onClick={async () => {
													setDropdownOpen((v) => {
														const next = !v
														if (!v) void fetchNotificationsCanonical()
														return next
													})
												}}
												className="relative inline-flex items-center px-3 py-1 rounded-md hover:bg-[#fffdf8] focus:outline-none"
											>
												<span className="text-[#103090] font-medium">Notifications</span>
												{unreadCount > 0 && (
													<span className="absolute -top-2 -right-3 bg-[#b89c4e] text-white rounded-full px-2 py-0.5 text-xs font-bold">{unreadCount}</span>
												)}
											</button>

											{dropdownOpen && (
												<div className="absolute right-0 mt-2 w-80 max-w-screen-sm bg-white border border-[#e7d6a9] rounded-xl shadow-lg z-50">
													<div className="p-3 border-b border-[#eee] flex items-center justify-between">
														<span className="font-semibold text-[#103090]">Notifications</span>
														<div className="flex items-center gap-2">
															{notifications.length > 0 && <button onClick={markAllAsRead} className="text-xs text-[#b89c4e] hover:underline">{t("notifications.mark_all_read")}</button>}
															<button onClick={() => setDropdownOpen(false)} className="text-xs text-[#717171]">{t("common.close")}</button>
														</div>
													</div>
													<div className="max-h-64 overflow-y-auto">
														{notifications.length === 0 ? (
															<div className="p-4 text-sm text-[#717171]">{t("notifications.empty")}</div>
														) : (
															notifications.slice(0, 20).map((n) => (
																<div key={n.id} className={`p-3 border-b last:border-b-0 flex items-start justify-between ${n.is_read ? "bg-white" : "bg-[#fffdf8]"}`}>
																	<div className="min-w-0 mr-3">
																		<div className="text-sm font-medium text-[#103090] truncate">{translateText(n.title)}</div>
																		<div className="text-xs text-[#616161] mt-1 truncate">{translateText(n.message)}</div>
																		<time className="text-[11px] text-[#9CA3AF] mt-2 block">{n.created_at ? new Date(n.created_at).toLocaleString() : ""}</time>
																	</div>
																	<div className="flex flex-col items-end gap-2">
																		{!n.is_read ? (
																			<NotificationActionButton onClick={() => markAsRead(n.id)} className={"text-xs text-[#103090] border-[#d9c38b]"}>{t("notifications.mark_read")}</NotificationActionButton>
																		) : (
																			<span className="text-xs text-[#9CA3AF]">{t("notifications.read")}</span>
																		)}
																	</div>
																</div>
															))
														)}
													</div>
												</div>
											)}
										</div>

										<button className="px-4 py-2 bg-[#b89c4e] hover:bg-[#103090] text-white rounded-lg transition-colors">Logout</button>
									</>
								) : (
									<>
										<Link href="/auth/login" className="text-[#717171] hover:text-[#103090] font-medium">Sign In</Link>
										<Link href="/auth/register" className="px-4 py-2 bg-[#b89c4e] hover:bg-[#103090] text-white rounded-lg transition-colors">Sign Up</Link>
									</>
								)}
							</div>
						</div>
					</div>
				</header>
			)}

			{/* Main Content */}
			<main className="pt-20 pb-20 min-h-[calc(100vh-160px)]">{children}</main>

			{/* Chat Assistant */}
			{!shouldHideHeaderFooter && <ChatBubble />}

			{/* Footer omitted for hidden pages */}
		</div>
	)
}
