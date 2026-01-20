"use client"

import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { performGlobalLogout } from "@/lib/auth-client"

export default function LogoutButton({ variant = "default" }: { variant?: "default" | "icon" }) {
  const { logout } = useAuth()

  const handleLogout = async () => {
    await performGlobalLogout({
      redirect: true,
      contextLogout: logout
    });
  }

  if (variant === "icon") {
    return (
      <Button onClick={handleLogout} variant="ghost" size="icon" aria-label="Logout" title="Logout">
        <LogOut className="h-5 w-5" />
      </Button>
    )
  }

  return (
    <Button onClick={handleLogout} variant="secondary" size="sm" className="bg-white/90 hover:bg-white">
      <LogOut className="h-4 w-4 mr-2" />
      Logout
    </Button>
  )
}
