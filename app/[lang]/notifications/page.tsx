"use client"

import { useEffect, useState, useMemo } from "react"
import { useTranslation } from "@/lib/i18n-context"
import { Bell, Check, Trash2, ChevronRight, Inbox, Clock } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

type Notif = {
  id: number | string
  title: string
  message: string
  is_read: boolean
  created_at?: string | null
  [k: string]: any
}

export default function NotificationsPage() {
  const { t, language, dir } = useTranslation()
  const router = useRouter()
  const isRTL = dir === "rtl"

  const [notifications, setNotifications] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)
  const [mutating, setMutating] = useState(false)

  const dateFormatter = useMemo(() =>
    new Intl.DateTimeFormat(language === "ar" ? "ar-MA" : language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short"
    }), [language]
  )

  // Helper to translate notification text that may contain translation keys
  // Helper to translate notification text that may contain translation keys
  const translateText = (text: string): string => {
    if (!text || !text.startsWith("__t:")) return text
    try {
      const parts = text.slice(4).split("|")
      const key = parts[0]
      const params: Record<string, string> = {}
      for (let i = 1; i < parts.length; i++) {
        const [k, v] = parts[i].split("=")
        if (k && v) {
          if (v.startsWith("__t:")) {
            params[k] = translateText(v)
          } else {
            params[k] = v
          }
        }
      }
      let translated = t(key as any)
      Object.entries(params).forEach(([k, v]) => {
        translated = translated.replace(`{${k}}`, v)
      })
      return translated
    } catch {
      return text
    }
  }

  async function fetchNotifications(): Promise<{ notifications: Notif[]; unreadCount: number } | null> {
    try {
      const res = await fetch("/api/notifications/me", { cache: "no-store", credentials: "include" })
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data.notifications) ? data.notifications : []
        const count = list.filter((n: any) => !n.is_read).length
        setNotifications(list)
        setUnreadCount(count)
        return { notifications: list, unreadCount: count }
      }
      return null
    } catch (err) {
      console.error("fetchNotifications error", err)
      return null
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 15000)

    // Listen for updates from the header (e.g. marking as read from dropdown)
    const onExternalUpdate = (e: Event) => {
      try {
        const detail = (e as CustomEvent)?.detail
        if (detail && Array.isArray(detail.notifications)) {
          setNotifications(detail.notifications)
          const count = detail.notifications.filter((n: any) => !n.is_read).length
          setUnreadCount(count)
        } else if (detail && typeof detail.unreadCount === "number") {
          setUnreadCount(detail.unreadCount)
        }
      } catch { }
    }
    window.addEventListener("notifications:updated", onExternalUpdate)

    return () => {
      clearInterval(interval)
      window.removeEventListener("notifications:updated", onExternalUpdate)
    }
  }, [])

  async function markAsRead(notificationId: number | string) {
    if (!notificationId || mutating) return
    setMutating(true)

    setNotifications(prev => prev.map(n => String(n.id) === String(notificationId) ? { ...n, is_read: true } : n))
    setUnreadCount(prev => Math.max(0, prev - 1))

    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ action: "markAsRead", notificationId }),
      })

      if (!res.ok) {
        await fetchNotifications()
        return
      }

      const canonical = await fetchNotifications()
      if (canonical) {
        window.dispatchEvent(new CustomEvent("notifications:updated", {
          detail: { unreadCount: canonical.unreadCount, notifications: canonical.notifications }
        }))
      }
    } catch (err) {
      console.error("markAsRead error", err)
      await fetchNotifications()
    } finally {
      setMutating(false)
    }
  }

  async function markAllAsRead() {
    if (mutating || unreadCount === 0) return
    setMutating(true)

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)

    try {
      const res = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        cache: "no-store",
        body: JSON.stringify({ action: "markAllAsRead" }),
      })

      if (!res.ok) {
        await fetchNotifications()
        return
      }

      const canonical = await fetchNotifications()
      if (canonical) {
        window.dispatchEvent(new CustomEvent("notifications:updated", {
          detail: { unreadCount: canonical.unreadCount, notifications: canonical.notifications }
        }))
      }
    } catch (err) {
      console.error("markAllAsRead error", err)
      await fetchNotifications()
    } finally {
      setMutating(false)
    }
  }

  const normalizedNotifications = useMemo(
    () =>
      notifications.map((n) => ({
        ...n,
        displayTitle: translateText(n.title),
        displayMessage: translateText(n.message),
        formattedDate: n.created_at ? dateFormatter.format(new Date(n.created_at)) : "",
      })),
    [notifications, dateFormatter, t]
  )

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAFBFC] pt-6 pb-12">
        <div className="max-w-3xl mx-auto px-6">
          <div className="flex items-center justify-between mb-8">
            <div className="h-8 w-48 bg-gray-200 animate-pulse rounded-lg" />
            <div className="h-10 w-32 bg-gray-200 animate-pulse rounded-full" />
          </div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-6 h-32 animate-pulse" />
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAFBFC] pt-6 pb-12" dir={dir}>
      <div className="max-w-3xl mx-auto px-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#103090] font-serif flex items-center gap-3">
              {t("notifications.title")}
              {unreadCount > 0 && (
                <span className="inline-flex items-center justify-center bg-[#B8071C] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg shadow-[#B8071C]/20">
                  {unreadCount}
                </span>
              )}
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              {unreadCount > 0
                ? (language === 'ar' ? `لديك ${unreadCount} إشعارات غير مقروءة` : language === 'fr' ? `Vous avez ${unreadCount} notifications non lues` : `You have ${unreadCount} unread notifications`)
                : (t("notifications.all_caught_up"))
              }
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={mutating}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-semibold text-gray-700 hover:bg-[#B8071C]/5 hover:text-[#B8071C] hover:border-[#B8071C]/20 transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              <Check size={16} />
              {t("notifications.mark_all_read")}
            </button>
          )}
        </div>

        {/* Notifications List */}
        {normalizedNotifications.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Inbox size={32} className="text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-[#103090] font-serif mb-1">{t("notifications.empty")}</h3>
            <p className="text-gray-500 text-sm max-w-xs mx-auto">
              {t("notifications.all_caught_up")}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {normalizedNotifications.map((n) => (
              <div
                key={String(n.id)}
                className={`group relative bg-white border transition-all duration-300 rounded-2xl overflow-hidden ${!n.is_read
                  ? "border-[#B8071C]/20 shadow-md shadow-[#B8071C]/5"
                  : "border-gray-100 shadow-sm hover:shadow-md"
                  }`}
              >
                {!n.is_read && (
                  <div className="absolute top-0 bottom-0 left-0 w-1 bg-[#B8071C]" />
                )}
                <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`text-base font-bold truncate font-serif ${!n.is_read ? 'text-[#B8071C]' : 'text-[#103090]'}`}>
                        {n.displayTitle}
                      </h3>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-[#B8071C] animate-pulse" />
                      )}
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-3">
                      {n.displayMessage}
                    </p>
                    <div className="flex items-center gap-3 text-[11px] font-medium text-gray-400">
                      <div className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                        <Clock size={12} />
                        {n.formattedDate}
                      </div>
                      {/* type badge removed to fix build worker crash */}
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex items-center md:flex-col gap-2">
                    {!n.is_read ? (
                      <button
                        onClick={() => markAsRead(n.id)}
                        disabled={mutating}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#B8071C]/5 text-[#B8071C] text-xs font-bold hover:bg-[#B8071C] hover:text-white transition-all active:scale-95 disabled:opacity-50"
                      >
                        <Check size={14} />
                        {t("notifications.mark_read")}
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-gray-300 px-4 py-2 flex items-center gap-1.5 uppercase tracking-wide">
                        <Check size={14} />
                        {t("notifications.read")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer info removed as it's not implemented in backend */}
      </div>
    </main>
  )
}
