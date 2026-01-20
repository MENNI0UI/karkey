"use client"

import { CheckCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n-context"

export default function RegistrationSuccessPage() {
  const { t } = useTranslation()
  const router = useRouter()

  const handleGoHome = () => {
    // Just navigate to home, user is already logged in
    window.location.href = "/"
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <Link href="/">
          <h1 className="text-4xl font-bold text-[#B8071C] mb-8 text-center hover:text-[#910515] transition-colors cursor-pointer">
            Karkey
          </h1>
        </Link>

        {/* Card */}
        <div className="bg-white border border-[#EBEBEB] rounded-2xl p-8 text-center">
          {/* Success Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#B8071C] mb-4">
            <CheckCircle className="w-9 h-9 text-white" strokeWidth={2.5} />
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-[#222222] mb-3">{t("auth.register.success_title")}</h2>

          {/* Description */}
          <p className="text-[#717171] mb-6 leading-relaxed">
            {t("auth.register.success_desc")}
          </p>

          {/* Buttons */}
          <div className="space-y-2.5">
            <Button
              onClick={handleGoHome}
              className="w-full bg-[#B8071C] hover:bg-[#910515] text-white rounded-xl py-5 font-semibold transition-all"
            >
              {t("auth.register.success_go_home")}
            </Button>
          </div>

          {/* Support */}
          <p className="text-xs text-[#717171] mt-6">
            {t("auth.register.success_need_help")}{" "}
            <a href="mailto:support@karkey.com" className="text-[#B8071C] hover:underline font-medium">
              {t("auth.register.success_contact")}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
