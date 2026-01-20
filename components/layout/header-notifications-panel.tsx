"use client"
import React, { useMemo, forwardRef } from "react"
import NotificationActionButton from "@/components/layout/notification-action-button"
import Link from "next/link"
import { Bell } from "lucide-react"
import { useTranslation } from "@/lib/i18n-context"
import { LuxuryLoader } from "@/components/ui/luxury-loader"

type Notif = {
  id: number | string
  title: string
  message: string
  is_read: boolean
  created_at?: string | null
  [k: string]: any
}
type HeaderNotificationsPanelProps = {
  notifications: Notif[]
  loadingNotifs: boolean
  unreadCount: number
  markAsRead: (id: number | string) => Promise<void>
  markAllAsRead: () => Promise<void>
  onClose: () => void
}

const HeaderNotificationsPanel = forwardRef<HTMLDivElement, HeaderNotificationsPanelProps>(function HeaderNotificationsPanel(
  { notifications, loadingNotifs, unreadCount, markAsRead, markAllAsRead, onClose },
  ref,
) {
  const { t, language } = useTranslation()
  const isRTL = language === "ar"
  const dateFormatter = useMemo(() => new Intl.DateTimeFormat(language === "ar" ? "ar-MA" : language === "fr" ? "fr-FR" : language === "es" ? "es-ES" : "en-US", { dateStyle: "medium", timeStyle: "short" }), [language])

  // Helper to translate notification text that may contain translation keys
  // Format: __t:key|param1=value1|param2=value2
  // Helper to translate notification text that may contain translation keys
  // Format: __t:key|param1=value1|param2=value2
  const translateText = (text: string): string => {
    if (!text || !text.startsWith("__t:")) return text
    try {
      const parts = text.slice(4).split("|")
      const key = parts[0]
      const params: Record<string, string> = {}
      for (let i = 1; i < parts.length; i++) {
        const [k, v] = parts[i].split("=")
        if (k && v) {
          // Check for nested translation (value starts with __t:)
          if (v.startsWith("__t:")) {
            params[k] = translateText(v)
          } else {
            params[k] = v
          }
        }
      }
      let translated = t(key as any)
      // Replace placeholders like {vehicle} with actual values
      Object.entries(params).forEach(([k, v]) => {
        translated = translated.replace(`{${k}}`, v)
      })
      return translated
    } catch {
      return text
    }
  }

  const normalizedNotifications = useMemo(
    () =>
      notifications.map((n) => ({
        ...n,
        title: translateText(n.title),
        message: translateText(n.message),
        formattedDate: n.created_at ? dateFormatter.format(new Date(n.created_at)) : "",
      })),
    [notifications, dateFormatter, language],
  )

  const emptyState = notifications.length === 0

  return (
    <div
      ref={ref}
      className="fixed mt-0 w-[360px] bg-white border border-gray-200 rounded-2xl shadow-2xl ring-1 ring-black/5 overflow-hidden"
      style={{ top: `calc(var(--site-header-height, 76px) + 8px)`, right: isRTL ? "auto" : 48, left: isRTL ? 48 : "auto", zIndex: 70000 }}
      role="dialog"
      aria-modal={false}
      dir={isRTL ? "rtl" : "ltr"}
    >
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
        <div className="flex items-center gap-2 text-[#103090]">
          <Bell className="w-4 h-4 text-[#B8071C]" />
          <span className="text-sm font-bold font-serif">{t("notifications.title")}</span>
        </div>
        <div className="flex items-center gap-2">
          {loadingNotifs && (
            <span className="text-[11px] font-medium text-[#B8071C] flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-[#B8071C] animate-pulse" aria-hidden />
              {t("notifications.updating")}
            </span>
          )}
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs font-semibold text-[#B8071C] hover:bg-[#B8071C]/10 bg-[#B8071C]/5 border border-[#B8071C]/20 px-3 py-1 rounded-full transition-colors"
            >
              {t("notifications.mark_all_read")}
            </button>
          )}
        </div>
      </div>
      <div className="max-h-96 overflow-auto bg-white">
        {loadingNotifs && emptyState ? (
          <div className="px-4 py-10 flex items-center justify-center text-[#64748b]">
            <LuxuryLoader size="sm" />
          </div>
        ) : emptyState ? (
          <div className="px-4 py-8 text-center">
            <div className="text-sm font-bold font-serif text-[#103090]">{t("notifications.empty")}</div>
            <div className="text-xs text-[#6b7280] mt-1">{t("notifications.all_caught_up")}</div>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {normalizedNotifications.map((n) => (
              <li
                key={String(n.id)}
                className={`px-4 py-4 transition-colors ${!n.is_read ? "bg-[#B8071C]/5" : "bg-white"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 text-[#103090]">
                    <div className="text-sm font-bold font-serif truncate">{n.title}</div>
                    <div className="text-xs text-[#5f6b7d] mt-1 truncate">{n.message}</div>
                    <time className="text-[11px] text-[#94a3b8] mt-2 block">{n.formattedDate}</time>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {!n.is_read ? (
                      <NotificationActionButton onClick={() => void markAsRead(n.id)}>
                        {t("notifications.mark_read")}
                      </NotificationActionButton>
                    ) : (
                      <span className="text-[11px] text-[#94a3b8]">{t("notifications.read")}</span>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
        <Link
          href={`/${language}/notifications`}
          onClick={onClose}
          className="block text-center text-xs font-bold font-serif text-[#103090] hover:text-[#B8071C] transition-colors"
        >
          {t("notifications.view_all")}
        </Link>
      </div>
    </div>
  )
})

export default HeaderNotificationsPanel
