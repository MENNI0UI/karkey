"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Mail, Phone, Calendar, UserIcon, ArrowLeft, XCircle } from "lucide-react"
import { getUserProfile } from "./actions"
import Link from "next/link"

interface UserProfile {
  id: number
  username: string
  email: string
  phone_number: string | null
  user_type: string

  created_at: string
  updated_at: string
}

export default function UserProfilePage() {
  const params = useParams()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUserProfile = async () => {
    setLoading(true)
    const userId = Number.parseInt(params.id as string)
    const result = await getUserProfile(userId)
    if (result.success && result.user) {
      setUser(result.user)
    } else {
      alert("Failed to load user profile")
    }
    setLoading(false)
  }

  useEffect(() => {
    loadUserProfile()
  }, [loadUserProfile])

  // const isVerified = user?.verification_status === "approved"

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF385C] mx-auto"></div>
          <p className="mt-4 text-[#717171]">Loading user profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="border-0 shadow-md">
          <CardContent className="p-12 text-center">
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <p className="text-gray-600 font-medium text-lg">User not found</p>
            <Link href="/admin">
              <Button className="mt-4 bg-[#FF385C] hover:bg-[#E31C5F]">Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-[#FF385C]">User Profile</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Header Card */}
        <Card className="border-0 shadow-md mb-6">
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-br from-[#FF385C] to-[#E31C5F] rounded-full flex items-center justify-center">
                  <UserIcon className="w-12 h-12 text-white" />
                </div>

              </div>

              {/* User Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-gray-900">@{user.username}</h2>

                </div>
                <p className="text-gray-600 mb-4">User ID: #{user.id}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined{" "}
                    {new Date(user.created_at).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="border-0 shadow-md mb-6">
          <CardHeader className="border-b border-gray-100 bg-gray-50">
            <CardTitle className="text-gray-900">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-[#B8071C]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-[#B8071C]" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Email Address</p>
                  <p className="text-sm font-medium text-gray-900">{user.email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Phone Number</p>
                  <p className="text-sm font-medium text-gray-900">{user.phone_number}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Details */}
        <Card className="border-0 shadow-md">
          <CardHeader className="border-b border-gray-100 bg-gray-50">
            <CardTitle className="text-gray-900">Account Details</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 mb-1">User Type</p>
                <p className="text-sm font-medium text-gray-900 capitalize">{user.user_type}</p>
              </div>



              <div>
                <p className="text-xs text-gray-500 mb-1">Account Created</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(user.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">Last Updated</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date(user.updated_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
