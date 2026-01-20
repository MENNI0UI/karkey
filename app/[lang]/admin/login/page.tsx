"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Lock, User, AlertCircle, Shield } from "lucide-react"
import { adminLogin } from "../actions"

export default function AdminLoginPage() {
  const router = useRouter()
  const [nom, setNom] = useState("")
  const [prenom, setPrenom] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!nom.trim() || !prenom.trim() || !password) {
      setError("Please fill in all fields")
      return
    }

    setLoading(true)
    try {
      const result = await adminLogin(nom.trim(), prenom.trim(), password)
      if (result?.success) {
        router.push("/admin")
        router.refresh()
      } else {
        setError(result?.error || "Login failed")
      }
    } catch (err) {
      console.error("Login error:", err)
      setError("An error occurred during login")
    } finally {
      setLoading(false)
    }
  }

  return (
    // Use a fixed full-viewport background so no parent container produces a central white column.
    <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[#f8fafc] via-[#ffffff] to-[#f1f5f9] p-6 z-0">
      {/* Card sits above the page background */}
      <Card className="w-full max-w-md border border-[#ececec] shadow-lg rounded-2xl relative z-10">
        <CardHeader className="p-6 text-center">
          <div className="mx-auto mb-3 w-16 h-16 rounded-2xl bg-gradient-to-br from-[#B8071C] to-[#910515] flex items-center justify-center shadow">
            {/* icon color adjusted to darker blue */}
            <Shield className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-xl font-semibold text-[#910515]">Admin Sign In</CardTitle>
          <p className="text-sm text-gray-500 mt-1">Restricted access — authorized personnel only</p>
        </CardHeader>

        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-sm text-destructive font-medium">{error}</p>
              </div>
            )}

            <label className="text-xs font-medium text-[#910515]">Last Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#B8071C]" />
              <Input
                type="text"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Enter your last name"
                className="pl-10 h-11 border-[#ececec] bg-white"
                disabled={loading}
                autoComplete="family-name"
              />
            </div>

            <label className="text-xs font-medium text-[#910515]">First Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#B8071C]" />
              <Input
                type="text"
                value={prenom}
                onChange={(e) => setPrenom(e.target.value)}
                placeholder="Enter your first name"
                className="pl-10 h-11 border-[#ececec] bg-white"
                disabled={loading}
                autoComplete="given-name"
              />
            </div>

            <label className="text-xs font-medium text-[#910515]">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#B8071C]" />
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="pl-10 h-11 border-[#ececec] bg-white"
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-[#B8071C] text-white font-semibold rounded-lg hover:bg-[#910515] transition"
            >
              {loading ? "Signing in…" : "Sign In"}
            </Button>

            <p className="text-center text-xs text-gray-500">
              Forgot password?{" "}
              <Link href="/admin/forgot-password" className="text-[#B8071C] hover:underline">
                Reset with recovery key
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
