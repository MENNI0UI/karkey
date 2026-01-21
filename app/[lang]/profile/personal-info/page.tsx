import dynamic from "next/dynamic"
import { getCurrentUser } from "@/lib/mysql-auth"
import { getUserProfile } from "../actions"
import { redirect } from "next/navigation"
import type { Profile } from "../personal-info-section" // <-- import Profile type
import HideHeaderFooter from "@/components/hide-header-footer"
const AuthSyncClient = dynamic(() => import("../auth-sync-client"))
const PersonalInfoSection = dynamic(() => import("../personal-info-section"))

export default async function PersonalInfoPage({
  searchParams: searchParamsPromise,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const searchParams = await searchParamsPromise;
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
  // Use the central getUserProfile helper which is resilient to schema differences
  const user = await getUserProfile(userId)
  if (!user) {
    // if profile couldn't be loaded, redirect to login (or show not-found depending on flow)
    redirect("/auth/login")
  }

  return (
    <>
      <HideHeaderFooter />
      <div className="min-h-screen bg-gradient-to-br from-[#faf5ef] via-[#fffdf8] to-[#ececec] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-2xl">
          <PersonalInfoSection
            profile={user as Profile}
            userId={userId}
            successFlag={searchParams?.success === "true"}
          />
        </div>
      </div>
    </>
  )
}
