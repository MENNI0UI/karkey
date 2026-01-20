"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"

interface EmailVerificationProps {
  email: string
  onVerified: () => void
  onBack: () => void
  lang?: string
}

export function EmailVerification({ email, onVerified, onBack, lang = "en" }: EmailVerificationProps) {
  const { t } = useTranslation()
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)

  // Send verification code
  const sendCode = useCallback(async () => {
    setSending(true)
    setError("")

    try {
      const res = await fetch("/api/auth/send-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lang }),
      })

      const data = await res.json()

      if (!res.ok) {
        const errorMessage = typeof data.error === 'object' && data.error?.message
          ? data.error.message
          : (typeof data.error === 'string' ? data.error : t("verification.send_failed"))
        setError(errorMessage)
        if (data.retryAfter) {
          setCountdown(data.retryAfter * 60)
        }
        return
      }

      setCodeSent(true)
      setCountdown(60) // 60 second cooldown before resend
    } catch {
      setError(t("verification.send_failed"))
    } finally {
      setSending(false)
    }
  }, [email, lang, t])

  // Auto-send code on mount
  useEffect(() => {
    sendCode()
  }, [sendCode])

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Verify code
  const verifyCode = async () => {
    if (code.length !== 6) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      })

      const data = await res.json()

      if (!res.ok) {
        const errorMessage = typeof data.error === 'object' && data.error?.message
          ? data.error.message
          : (typeof data.error === 'string' ? data.error : t("verification.invalid_code"))
        setError(errorMessage)
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts)
        }
        setCode("")
        return
      }

      setSuccess(true)
      // Wait a moment to show success state
      setTimeout(() => {
        onVerified()
      }, 1000)
    } catch {
      setError(t("verification.verify_failed"))
      setCode("")
    } finally {
      setLoading(false)
    }
  }

  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (code.length === 6 && !loading && !success) {
      verifyCode()
    }
  }, [code])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Email Icon & Info */}
      <div className="text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-[#fef2f2] rounded-full flex items-center justify-center">
          {success ? (
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          ) : (
            <Mail className="w-8 h-8 text-[#B8071C]" />
          )}
        </div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {success ? t("verification.success_title") : t("verification.title")}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {success
              ? t("verification.success_message")
              : t("verification.sent_to", { email })}
          </p>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {error}
            {remainingAttempts !== null && remainingAttempts > 0 && (
              <span className="text-xs">
                ({t("verification.attempts_remaining", { count: remainingAttempts })})
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* OTP Input */}
      {!success && (
        <div className="flex flex-col items-center space-y-4">
          <InputOTP
            value={code}
            onChange={setCode}
            maxLength={6}
            disabled={loading || success}
          >
            <InputOTPGroup>
              <InputOTPSlot index={0} className="w-12 h-14 text-xl" />
              <InputOTPSlot index={1} className="w-12 h-14 text-xl" />
              <InputOTPSlot index={2} className="w-12 h-14 text-xl" />
              <InputOTPSlot index={3} className="w-12 h-14 text-xl" />
              <InputOTPSlot index={4} className="w-12 h-14 text-xl" />
              <InputOTPSlot index={5} className="w-12 h-14 text-xl" />
            </InputOTPGroup>
          </InputOTP>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <div className="w-4 h-4 border-2 border-[#B8071C] border-t-transparent rounded-full animate-spin" />
              {t("verification.verifying")}
            </div>
          )}
        </div>
      )}

      {/* Resend Button */}
      {!success && (
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-2">
            {t("verification.didnt_receive")}
          </p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={sendCode}
            disabled={sending || countdown > 0}
            className="text-[#B8071C] hover:text-[#B8071C]/80"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${sending ? "animate-spin" : ""}`} />
            {countdown > 0
              ? t("verification.resend_in", { seconds: countdown })
              : t("verification.resend")}
          </Button>
        </div>
      )}

      {/* Back Button */}
      {!success && (
        <div className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="w-full h-12 rounded-xl border-gray-200 hover:bg-gray-50"
          >
            {t("verification.change_email")}
          </Button>
        </div>
      )}
    </div>
  )
}
