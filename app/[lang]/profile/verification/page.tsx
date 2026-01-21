import dynamic from "next/dynamic"
import { getCurrentUser } from "@/lib/mysql-auth"
import { redirect } from "next/navigation"
const AuthSyncClient = dynamic(() => import("../auth-sync-client"))

export default async function VerificationPage() {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return (
      <>
        <div id="auth-sync-root" />
        <AuthSyncClient fallbackRedirect="/auth/login" />
      </>
    )
  }

  // Redirect to main profile page with verification hash
  const userId = (currentUser as any).userId ?? (currentUser as any).id
  if (!userId) {
    return <AuthSyncClient fallbackRedirect="/auth/login" />
  }
  // safe client redirect via Next.js navigation on server:
  redirect("/profile#verification")
}
