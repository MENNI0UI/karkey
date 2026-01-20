import dynamic from "next/dynamic"
import { getCurrentUser } from "@/lib/mysql-auth"
import { getUserProfile } from "../actions"
import { redirect } from "next/navigation"
import type { Profile } from "../personal-info-section" // <-- import Profile type
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
        <script dangerouslySetInnerHTML={{
          __html: `
          (function(){
            try{
              const fallback="/auth/login";
              const t = (localStorage.getItem("auth_token")||localStorage.getItem("auth:token")||null);
              if(!t){ location.replace(fallback); return; }
              fetch("/api/auth/session",{method:"POST",credentials:"include",headers:{"Content-Type":"application/json"},body:JSON.stringify({token:t})})
                .then(()=>{ try{ location.replace(window.location.pathname || "/profile"); }catch(e){ location.replace("/profile"); } })
                .catch(()=>{ try{ location.replace(fallback) }catch{} });
            }catch(e){ try{ location.replace("/auth/login") }catch{} }
          })();
        `}} />
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
      <style dangerouslySetInnerHTML={{ __html: `header, footer { display: none !important; visibility: hidden !important; }` }} />
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
