"use client"

import { usePathname } from "next/navigation"
import type React from "react"

const SHELL_ALLOWED_PATHS = new Set(["/", "/auctions", "/direct-sales", "/about"])
const SHELL_ALLOWED_PREFIXES = ["/auctions/", "/direct-sales/"]
const SHELL_BLOCKED_PREFIXES = ["/auth", "/profile", "/notification"]

export function LayoutShell({
  serverPathname,
  children,
}: {
  serverPathname: string
  children: React.ReactNode
}) {
  const clientPathname = usePathname()
  const pathname = clientPathname || serverPathname

  const isAdmin = pathname.startsWith("/admin")
  const isAdminLogin = pathname === "/admin/login"

  const hideShell = SHELL_BLOCKED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )

  const showShell =
    !hideShell &&
    (SHELL_ALLOWED_PATHS.has(pathname) ||
      SHELL_ALLOWED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
      isAdmin)

  if (!showShell) {
    return <>{children}</>
  }

  const headerHeightPx = isAdminLogin ? 64 : 80

  return (
    <>
      {children}
      <style jsx global>{`
        body {
          padding-top: ${headerHeightPx}px;
          padding-bottom: 80px;
        }
        main {
          min-height: calc(100vh - ${headerHeightPx + 80}px);
        }
      `}</style>
    </>
  )
}
