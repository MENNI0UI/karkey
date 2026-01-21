import { redirect } from "next/navigation"
import { getCurrentUser, verifyToken } from "@/lib/mysql-auth"
import { cookies } from "next/headers"
import { getUserProfile, getUserAuctions, getWatchlistForUser, getDirectSalesWatchlistForUser } from "./actions"
import { ListingItem } from "./types"
import { Card } from "@/components/ui/card"
import dynamic from "next/dynamic"
import AuthSyncClient from "./auth-sync-client" // Direct import since it's client component


// Skeleton loaders for better UX
const MenuSkeleton = () => (
  <div className="hidden md:block fixed top-0 bottom-0 w-[19rem] bg-gradient-to-b from-[#f2faf5] to-white animate-pulse" />
)

// dynamic imports for client-only components with loading states
const ProfileMenu = dynamic(() => import("./profile-menu"), {
  loading: () => <MenuSkeleton />
})
const ProfileMobileMenu = dynamic(() => import("./profile-mobile-menu"))
const ProfileLayoutWrapper = dynamic(() => import("./profile-layout-wrapper"))
// Import SectionsSwitcher directly (not dynamic) for faster initial render
import SectionsSwitcher from "./sections-switcher"

type MenuSection = {
  id: string
  label: string
  count?: number
}

export default async function ProfilePage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ success?: string; tab?: string }>
}) {
  const searchParams = await searchParamsPromise;
  // try primary helper first
  let currentUser = await getCurrentUser()

  // fallback: if helper returned null, attempt to read auth_token cookie directly (SSR)
  if (!currentUser) {
    try {
      const cs = await cookies()
      const token = cs.get("auth_token")?.value ?? cs.get("auth:token")?.value ?? null
      if (token) {
        const payload = await verifyToken(token).catch(() => null)
        if (payload && payload.userId) {
          currentUser = { userId: Number(payload.userId), email: payload.email ?? null }
        }
      }
    } catch (e) {
      // swallow; we'll fall back to client sync below
    }
  }

  // If server couldn't resolve the current user, avoid server-side redirect.
  // Render a client component that will attempt to sync a local token -> server cookie,
  // then navigate back to /profile (or to /auth/login if no token).
  if (!currentUser) {
    // If no server user, render a minimal client-side sync snippet (avoids dynamic import/undefined issues)
    // This inline script is intentionally tiny and silent: it POSTs any local token to /api/auth/session
    // then reloads the current path so SSR can see the HttpOnly cookie (or redirects to login).
    return (
      <>
        <div id="auth-sync-root" />
        <AuthSyncClient fallbackRedirect="/auth/login" />
      </>
    )
  }

  const userId = (currentUser as any).userId ?? (currentUser as any).id

  // If currentUser exists but we couldn't resolve an id on the server,
  // avoid an immediate server redirect — perform a minimal client-side sync
  // (post local token to /api/auth/session, then reload) instead of returning
  // an undefined client component.
  if (!userId) {
    return (
      <>
        <div id="auth-sync-root" />
        <AuthSyncClient fallbackRedirect="/auth/login" />
      </>
    )
  }

  // Fetch profile only (fast)
  const profile = await getUserProfile(userId)

  // We no longer fetch auctions/watchlists server-side to allow instant page load.
  // The client components will fetch them asynchronously.
  const auctions: ListingItem[] | undefined = undefined
  const watchlist: ListingItem[] | undefined = undefined
  const dsWatchlist: ListingItem[] | undefined = undefined

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#fffaf2' }}>
        <Card className="w-full max-w-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Profile not found</h2>
          <p className="text-gray-600 mb-4">Unable to load your profile. Please try again.</p>
        </Card>
      </div>
    )
  }

  // safe alias to avoid repeated non-null assertions
  const p: any = profile

  const sections: MenuSection[] = [
    { id: "personal-info", label: "My Profile" },
    { id: "listings", label: "My Listings" },
    { id: "favorites", label: "My Favorites" },
    { id: "statistics", label: "Statistics" },
  ]

  return (
    <>
      <div className="min-h-screen bg-[#f8fafc]">
        {/* Fixed left sidebar menu */}
        <ProfileMenu
          sections={sections}
          profilePicture={p.profile_picture}
          username={p.username}
          userId={userId}

        />
        {/* Main content with padding for sidebar */}
        <ProfileLayoutWrapper>
          {/* Add padding top for fixed tabs bar on mobile/tablet */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-0 pt-14 lg:pt-12">
            <div className="w-full max-w-7xl relative">
              <main className="space-y-0 relative z-10">
                {/* Section router: show one section at a time based on ?tab= query param */}
                <SectionsSwitcher
                  profile={p}
                  userId={userId}
                  auctions={auctions} // undefined -> trigger client fetch
                  watchlist={watchlist} // undefined -> trigger client fetch
                  dsWatchlist={dsWatchlist} // undefined -> trigger client fetch
                  successFlag={searchParams?.success === "true"}
                  initialTab={searchParams?.tab || "personal-info"}
                />
              </main>
              {/* Mobile pills menu moved below content */}
              <div className="md:hidden mt-4 relative z-10">
                <ProfileMobileMenu sections={sections} />
              </div>
            </div>
          </div>
        </ProfileLayoutWrapper>
      </div>
    </>
  )
}
