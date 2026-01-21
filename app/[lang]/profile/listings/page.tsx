import { getCurrentUser } from "@/lib/mysql-auth"
import { getUserAuctions } from "../actions"
import { redirect } from "next/navigation"
import dynamic from "next/dynamic"
import HideHeaderFooter from "@/components/hide-header-footer"
const ListingsSection = dynamic(() => import("../listings-section"))

// client-only helper to silently sync token from localStorage -> server cookie
const AuthSyncClient = dynamic(() => import("../auth-sync-client"))

export default async function ListingsPage() {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return (
      <>
        <div id="auth-sync-root" />
        <AuthSyncClient fallbackRedirect="/auth/login" />
      </>
    )
  }

  const userId = (currentUser as any).userId ?? (currentUser as any).id
  if (!userId) {
    return <AuthSyncClient fallbackRedirect="/auth/login" />
  }
  const auctionsResult = await getUserAuctions(userId)
  const auctions: any[] = (auctionsResult && auctionsResult.auctions) || []

  return (
    <>
      <HideHeaderFooter />
      <div className="min-h-screen bg-gradient-to-br from-[#faf5ef] via-[#fffdf8] to-[#ececec] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl">
          <ListingsSection auctions={auctions} />
        </div>
      </div>
    </>
  )
}
