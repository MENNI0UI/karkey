import { getCurrentUser } from "@/lib/mysql-auth"
import { getUserAuctions } from "../actions"
import { redirect } from "next/navigation"
import dynamic from "next/dynamic"
const ListingsSection = dynamic(() => import("../listings-section"))

// client-only helper to silently sync token from localStorage -> server cookie
const AuthSyncClient = dynamic(() => import("../auth-sync-client"))

export default async function ListingsPage() {
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
                .then(()=>{ try{ location.replace((window.location.pathname + window.location.hash) || "/profile"); }catch(e){ location.replace("/profile"); } })
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
  const auctionsResult = await getUserAuctions(userId)
  const auctions: any[] = (auctionsResult && auctionsResult.auctions) || []

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `header, footer { display: none !important; visibility: hidden !important; }` }} />
      <div className="min-h-screen bg-gradient-to-br from-[#faf5ef] via-[#fffdf8] to-[#ececec] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-4xl">
          <ListingsSection auctions={auctions} />
        </div>
      </div>
    </>
  )
}
