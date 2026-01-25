"use client"
import React, { useEffect, useState } from "react"
import { CheckCircle, AlertCircle, LogIn, X, Send, Phone, Mail, User, MessageSquare } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"
import { LuxuryLoader } from "@/components/ui/luxury-loader"
import Link from "next/link"

interface UserInfo {
  userId: number
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
}

interface ExistingRequest {
  id: number
  created_at: string
  processed: number
}

interface ContactUsModalProps {
  open: boolean
  onClose: () => void
  directSaleId: number | null
  listingTitle?: string
  listingPrice?: string | number
  inline?: boolean // If true, renders as card overlay instead of fixed modal
}

export default function ContactUsModal({ open, onClose, directSaleId, listingTitle, listingPrice, inline = false }: ContactUsModalProps) {
  const { t, language } = useTranslation()
  const isRTL = language === "ar"
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<null | { id: number }>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [existingRequest, setExistingRequest] = useState<ExistingRequest | null>(null)
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  useEffect(() => {
    if (open && directSaleId) {
      setSuccess(null)
      setError(null)
      setLoading(true)
      // Fetch user info and check for existing request
      fetch(`/api/direct-sales-contact?direct_sale_id=${directSaleId}`, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          if (data.userInfo) {
            setUserInfo(data.userInfo)
            setIsAuthenticated(true)
            // Pre-fill form with user info
            const fullName = [data.userInfo.firstName, data.userInfo.lastName].filter(Boolean).join(" ")
            setName(fullName || "")
            setEmail(data.userInfo.email || "")
            setPhone(data.userInfo.phone || "")
          } else {
            setIsAuthenticated(false)
          }
          if (data.existingRequest) {
            setExistingRequest(data.existingRequest)
          } else {
            setExistingRequest(null)
          }
        })
        .catch(() => { setIsAuthenticated(false) })
        .finally(() => setLoading(false))
    } else if (!open) {
      // Reset when closing
      setName("")
      setEmail("")
      setPhone("")
      setMessage("")
      setExistingRequest(null)
      setUserInfo(null)
      setIsAuthenticated(null)
    }
  }, [open, directSaleId])

  if (!open) return null

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setError(null)
    if (!directSaleId) { setError(t("contact.error_invalid" as any)); return }
    if (!name && !phone && !email) { setError(t("contact.error_method" as any)); return }
    setSubmitting(true)
    try {
      const body = { direct_sale_id: directSaleId, name: name || null, email: email || null, phone: phone || null, message: message || null }
      const res = await fetch("/api/direct-sales-contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data?.success) {
        setSuccess({ id: data.id || null })
        setMessage("")
      } else if (data?.duplicate) {
        setError(t("contact.error_duplicate" as any))
      } else {
        const errorData = data?.error
        const errorMessage = typeof errorData === 'object' && errorData?.message
          ? errorData.message
          : (typeof errorData === 'string' ? errorData : t("contact.error_network" as any))
        setError(errorMessage)
      }
    } catch (err) {
      setError(t("contact.error_network" as any))
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price
    return new Intl.NumberFormat(language === "ar" ? "ar-MA" : "fr-MA", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(numPrice) + " " + t('common.mad')
  }

  // Inline mode - renders as card overlay
  if (inline) {
    return (
      <div className={`absolute inset-0 z-[100] bg-white rounded-3xl flex flex-col overflow-hidden shadow-lg ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 bg-white">
          <h3 className="text-xl font-medium text-[#103090] font-serif">{t("contact.title" as any)}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Listing Info */}
        {listingTitle && (
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <p className="text-lg text-gray-900 font-medium truncate font-serif">{listingTitle}</p>
            {listingPrice && <p className="text-lg text-[#B8071C] font-medium">{formatPrice(listingPrice)}</p>}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <style jsx>{`
            div::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {loading ? (
            <div className="flex items-center justify-center h-full min-h-[150px]">
              <LuxuryLoader size="sm" />
            </div>
          ) : isAuthenticated === false ? (
            /* Login Required */
            <div className="p-4 text-center flex flex-col items-center justify-center h-full min-h-[200px]">
              <div className="w-10 h-10 bg-[#B8071C]/10 rounded-full flex items-center justify-center mb-2">
                <LogIn className="w-5 h-5 text-[#B8071C]" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">{t("contact.login_required" as any)}</h4>
              <p className="text-xs text-gray-600 mb-3">{t("contact.login_message" as any)}</p>
              <div className="flex gap-2">
                <button onClick={onClose} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                  {t("common.cancel")}
                </button>
                <Link href={`/${language}/auth/login`} className="px-3 py-1.5 text-xs rounded-lg bg-[#B8071C] text-white hover:bg-[#910515] inline-flex items-center gap-1">
                  <LogIn className="w-3 h-3" />
                  {t("auth.login.submit")}
                </Link>
              </div>
            </div>
          ) : existingRequest ? (
            /* Already Contacted */
            <div className="p-3">
              <div className="bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-6 h-6 mt-0.5 flex-shrink-0" />
                  <div className="text-lg">
                    <p className="font-medium text-amber-900 leading-snug">{t("contact.already_contacted" as any)}</p>
                    <p className="mt-1 font-normal opacity-90">{t("contact.status" as any)}: {existingRequest.processed ? t("contact.processed" as any) : t("contact.pending" as any)}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : success ? (
            /* Success */
            <div className="p-4 text-center flex flex-col items-center justify-center h-full min-h-[200px]">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="text-sm font-bold text-gray-900 mb-1">{t("contact.success_title" as any)}</h4>
              <p className="text-xs text-gray-600 mb-3">{t("contact.success_desc" as any).replace("{id}", String(success.id) || '—')}</p>
              <button onClick={onClose} className="px-4 py-1.5 text-xs bg-[#B8071C] text-white rounded-lg hover:bg-[#910515]">
                {t("common.close")}
              </button>
            </div>
          ) : (
            /* Form */
            <form onSubmit={handleSubmit} className="p-3 space-y-2">
              {error && <div className="text-sm text-red-700 bg-red-50 rounded px-3 py-2 border border-red-100">{error}</div>}

              <div>
                <div className="relative">
                  <User className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={t("contact.full_name_placeholder" as any)}
                    readOnly={!!userInfo?.firstName}
                    className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3.5 text-base border border-gray-200 rounded-xl focus:ring-1 focus:ring-[#B8071C]/20 focus:border-[#B8071C] ${!!userInfo?.firstName ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white"}`}
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Phone className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder={t("contact.phone_placeholder" as any)}
                    readOnly={!!userInfo?.phone}
                    className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3.5 text-base border border-gray-200 rounded-xl focus:ring-1 focus:ring-[#B8071C]/20 focus:border-[#B8071C] ${!!userInfo?.phone ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white"}`}
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <Mail className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t("contact.email_placeholder" as any)}
                    readOnly={!!userInfo?.email}
                    className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3.5 text-base border border-gray-200 rounded-xl focus:ring-1 focus:ring-[#B8071C]/20 focus:border-[#B8071C] ${!!userInfo?.email ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white"}`}
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <MessageSquare className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-3 w-4 h-4 text-gray-400`} />
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={t("contact.message_placeholder" as any)}
                    rows={3}
                    className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3.5 text-base border border-gray-200 rounded-xl focus:ring-1 focus:ring-[#B8071C]/20 focus:border-[#B8071C] resize-none`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-[#B8071C] hover:bg-[#910515] disabled:bg-gray-400 text-white text-base font-semibold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.98]"
              >
                {submitting ? (
                  <>
                    <LuxuryLoader size="sm" className="mr-2" />
                    {t("contact.sending" as any)}
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    {t("contact.send" as any)}
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    )
  }

  // Fixed modal mode (default)

  return (
    <div className="fixed inset-0 z-[100003] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={`relative bg-white rounded-xl shadow-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto ${isRTL ? "rtl" : "ltr"}`} dir={isRTL ? "rtl" : "ltr"}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between">
          <h2 className="text-base font-bold text-[#103090] font-serif">{t("contact.title" as any)}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Listing Info */}
        {listingTitle && (
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
            <div className="text-sm text-gray-600">
              <span className="font-medium text-gray-900">{listingTitle}</span>
              {listingPrice && <span className="text-[#B8071C] font-bold ml-2">{formatPrice(listingPrice)}</span>}
            </div>
          </div>
        )}

        {loading ? (
          <div className="p-6 flex items-center justify-center">
            <LuxuryLoader size="sm" />
          </div>
        ) : isAuthenticated === false ? (
          /* Login Required State */
          <div className="p-5 text-center">
            <div className="w-12 h-12 bg-[#B8071C]/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <LogIn className="w-6 h-6 text-[#B8071C]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{t("contact.login_required" as any) || "Login Required"}</h3>
            <p className="text-sm text-gray-600 mb-4">{t("contact.login_message" as any) || "Please log in to contact Karkey."}</p>
            <div className="flex items-center justify-center gap-2">
              <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium">
                {t("common.cancel")}
              </button>
              <Link href={`/${language}/auth/login`} className="px-4 py-2 rounded-lg bg-[#B8071C] text-white text-sm font-medium hover:bg-[#910515] transition-colors inline-flex items-center gap-1.5">
                <LogIn className="w-3.5 h-3.5" />
                {t("auth.login.submit")}
              </Link>
            </div>
          </div>
        ) : existingRequest ? (
          /* Already Contacted State */
          <div className="p-4">
            <div className="bg-[#B8071C]/10 border border-[#B8071C]/20 text-[#B8071C] p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">{t("contact.already_contacted" as any)}</p>
                  <p className="mt-1 opacity-80">
                    {t("contact.request_submitted" as any).replace("{id}", String(existingRequest.id)).replace("{date}", formatDate(existingRequest.created_at))}
                  </p>
                  <p className="mt-1 opacity-80">
                    {t("contact.status" as any)}: {existingRequest.processed ? t("contact.processed" as any) : t("contact.pending" as any)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : success ? (
          /* Success State */
          <div className="p-5 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Send className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">{t("contact.success_title" as any)}</h3>
            <p className="text-sm text-gray-600 mb-4">{t("contact.success_desc" as any).replace("{id}", String(success.id) || '—')}</p>
            <button onClick={onClose} className="px-5 py-2 bg-[#B8071C] text-white text-sm font-semibold rounded-lg hover:bg-[#910515] transition-colors">
              {t("common.close")}
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            {error && <div className="text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2">{error}</div>}

            {/* Name */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t("contact.full_name" as any)}</label>
              <div className="relative">
                <User className={`absolute ${isRTL ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t("contact.full_name_placeholder" as any)}
                  readOnly={!!userInfo?.firstName}
                  className={`w-full ${isRTL ? 'pr-8 pl-3' : 'pl-8 pr-3'} py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#B8071C]/20 focus:border-[#B8071C] transition-all ${userInfo?.firstName ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white"}`}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t("contact.phone" as any)}</label>
              <div className="relative">
                <Phone className={`absolute ${isRTL ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder={t("contact.phone_placeholder" as any)}
                  readOnly={!!userInfo?.phone}
                  className={`w-full ${isRTL ? 'pr-8 pl-3' : 'pl-8 pr-3'} py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#B8071C]/20 focus:border-[#B8071C] transition-all ${userInfo?.phone ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white"}`}
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t("contact.email" as any)}</label>
              <div className="relative">
                <Mail className={`absolute ${isRTL ? 'right-2.5' : 'left-2.5'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={t("contact.email_placeholder" as any)}
                  readOnly={!!userInfo?.email}
                  className={`w-full ${isRTL ? 'pr-8 pl-3' : 'pl-8 pr-3'} py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#B8071C]/20 focus:border-[#B8071C] transition-all ${userInfo?.email ? "bg-gray-50 text-gray-500 cursor-not-allowed" : "bg-white"}`}
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">{t("contact.message" as any)}</label>
              <div className="relative">
                <MessageSquare className={`absolute ${isRTL ? 'right-2.5' : 'left-2.5'} top-2.5 w-4 h-4 text-gray-400`} />
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder={t("contact.message_placeholder" as any)}
                  rows={3}
                  className={`w-full ${isRTL ? 'pr-8 pl-3' : 'pl-8 pr-3'} py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#B8071C]/20 focus:border-[#B8071C] transition-all resize-none`}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-[#B8071C] hover:bg-[#910515] disabled:bg-gray-400 text-white text-sm font-semibold py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {submitting ? (
                <>
                  <LuxuryLoader size="sm" className="mr-2" />
                  {t("contact.sending" as any)}
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  {t("contact.send" as any)}
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
