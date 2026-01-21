"use client"
import React, { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import Header from "./header"
import Footer from "./Footer"
import { AuthProvider } from "@/lib/auth-context"
import FetchGuard from "@/components/fetch-guard"
import { Toaster } from "@/components/ui/toaster"
import BackButton, { saveLastNonProfilePage } from "@/app/[lang]/profile/back-button";
import { SessionProvider } from "next-auth/react"
import { LazyMotion, domAnimation } from "framer-motion"

export default function ClientLayout({ children, isLoggedIn }: { children: React.ReactNode; isLoggedIn?: boolean }) {
  const pathname = usePathname() || "/"
  // Removed artificial delay
  const [pageLoading, setPageLoading] = useState(false)

  // Hide header/footer on auth, admin, and profile routes.
  const shouldHideHeaderFooter =
    /^(\/[a-z]{2})?\/(auth\/|admin|profile)/.test(pathname)

  // Save last non-profile page for the back button
  useEffect(() => {
    saveLastNonProfilePage()
  }, [pathname])
  useEffect(() => {
    try {
      const pathname = (typeof window !== "undefined" && window.location && window.location.pathname) ? window.location.pathname : ""
      // match /auctions/<id> (single-segment id) — do NOT match /auctions or deeper paths
      const isAuctionDetail = /^\/auctions\/[^/]+$/.test(pathname)
      if (isAuctionDetail) document.body.classList.add("auction-detail")
      else document.body.classList.remove("auction-detail")
    } catch { }
    // also update on client navigation (listen to popstate)
    const onNav = () => {
      try {
        const p = window.location.pathname
        const isDetail = /^\/auctions\/[^/]+$/.test(p)
        if (isDetail) document.body.classList.add("auction-detail")
        else document.body.classList.remove("auction-detail")
      } catch { }
    }
    window.addEventListener("popstate", onNav)
    window.addEventListener("pushstate" as any, onNav) // defensive (some routers emit custom event)
    return () => {
      try {
        window.removeEventListener("popstate", onNav)
        window.removeEventListener("pushstate" as any, onNav)
        document.body.classList.remove("auction-detail")
      } catch { }
    }
  }, [])

  // Always scroll to top when the pathname changes so navigated pages start
  // from the very top. This makes client-side navigation behave like full
  // page navigations and avoids preserving scroll position between pages.
  useEffect(() => {
    try {
      // reset common scroll roots
      if (typeof window !== "undefined") {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" })
        // defensive resets for some browsers / layouts
        if (document.documentElement) document.documentElement.scrollTop = 0
        if (document.body) document.body.scrollTop = 0
      }
    } catch { }
  }, [pathname])

  // Reduce painting cost while user is scrolling:
  // - add 'is-scrolling' to body while scrolling (debounced), so CSS can temporarily simplify shadows/transitions
  useEffect(() => {
    if (typeof window === "undefined") return
    let rafId: number | null = null
    let removeTimer: number | null = null

    const setScrolling = () => {
      try {
        document.body.classList.add("is-scrolling")
        if (removeTimer) window.clearTimeout(removeTimer)
        // remove after short delay once scrolling stops
        removeTimer = window.setTimeout(() => {
          // remove via rAF to batch DOM ops
          rafId = window.requestAnimationFrame(() => {
            try { document.body.classList.remove("is-scrolling") } catch { }
          })
        }, 140) // ~140ms keeps class during short continuous scrolls
      } catch { }
    }

    const onScroll = () => {
      // use rAF to avoid running heavy work on high frequency scroll events
      if (rafId != null) return
      rafId = window.requestAnimationFrame(() => {
        rafId = null
        setScrolling()
      })
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("touchmove", onScroll, { passive: true })

    return () => {
      try {
        window.removeEventListener("scroll", onScroll)
        window.removeEventListener("touchmove", onScroll)
        if (rafId) window.cancelAnimationFrame(rafId)
        if (removeTimer) window.clearTimeout(removeTimer)
        document.body.classList.remove("is-scrolling")
      } catch { }
    }
  }, [])

  return (
    <SessionProvider>
      <FetchGuard />
      <AuthProvider>
        <LazyMotion features={domAnimation}>
          {!shouldHideHeaderFooter ? (
            <Header initialLoggedIn={isLoggedIn} />
          ) : null}

          {/* Always reserve header space unless hidden */}
          {!shouldHideHeaderFooter ? (
            <div aria-hidden="true" style={{ height: "var(--site-header-height, 76px)" }} />
          ) : null}

          {pageLoading && !pathname.startsWith("/admin") && (
            /* make loading overlay non-white to avoid white flash on refresh/hydration */
            <div
              className="fixed inset-0 z-[100001] flex items-center justify-center bg-transparent backdrop-blur-sm pointer-events-none"
              aria-hidden="true"
            >
              <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-[#B8071C]" />
            </div>
          )}

          <main>{children}</main>

          {!shouldHideHeaderFooter ? (
            <Footer />
          ) : null}

          <Toaster />
        </LazyMotion>
      </AuthProvider>
    </SessionProvider>
  )
}

