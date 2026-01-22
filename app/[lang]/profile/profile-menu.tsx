"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n-context";
import {
  User,
  ShieldCheck,
  Clock,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  LogOut,
  Heart,
  Store,
  MessageCircle,
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ProfilePictureUpload from "./profile-picture-upload";
import LogoutButton from "./logout-button";
import { performGlobalLogout } from "@/lib/auth-client";
import { getLastNonProfilePage } from "./back-button";

export type MenuSection = {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  count?: number;
};

export default function ProfileMenu({
  sections,
  profilePicture,
  username,
  userId,
}: {
  sections: MenuSection[];
  profilePicture?: string | null;
  username: string;
  userId: number;
}) {
  const { t, language } = useTranslation();
  const isRTL = language === "ar";
  const [active, setActive] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get translated label for section id
  const getLabel = (id: string, fallbackLabel: string) => {
    const labelMap: Record<string, string> = {
      "personal-info": t("nav.my_profile"),
      "listings": t("nav.my_listings"),
      "favorites": t("nav.my_favorites"),
      "statistics": t("profile.statistics"),
    };
    return labelMap[id] || fallbackLabel;
  };

  const ids = useMemo(() => sections.map((s) => s.id), [sections]);

  // مصدر الحقيقة الوحيد للتبويب النشط هو الـ query parameter ?tab=
  useEffect(() => {
    const tab = searchParams.get("tab") || "personal-info";
    setActive(ids.includes(tab) ? tab : sections?.[0]?.id || "personal-info");
  }, [searchParams, ids, sections]);

  // Track whether we're on a large (lg+) viewport so we can avoid rendering
  // the in-menu back button on desktop (keep only the aside arrow).
  const [isLarge, setIsLarge] = useState(false);
  useEffect(() => {
    const check = () => setIsLarge(typeof window !== "undefined" ? window.innerWidth >= 1024 : false);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const iconFor = (id: string) => {
    if (id === "overview") return LayoutGrid;
    if (id === "personal-info") return User;
    if (id === "listings") return Store;
    if (id === "listings-pending") return Clock;
    if (id === "listings-active") return CheckCircle2;
    if (id === "listings-rejected") return XCircle;
    if (id === "favorites") return Heart;
    if (id === "statistics") return LayoutGrid;
    return User;
  };

  const scrollTo = (id: string) => (e?: React.MouseEvent) => {
    e?.preventDefault();
    // Use pushState for instant navigation without server re-render
    window.history.pushState(null, "", `/${language}/profile?tab=${id}`);
    // Dispatch a custom event so sections-switcher can listen
    window.dispatchEvent(new CustomEvent("tabchange", { detail: id }));
    setActive(id);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const currentScroll = window.scrollY || window.pageYOffset;
        const offset = window.innerWidth < 768 ? 90 : 64;
        const target = rect.top + currentScroll - offset;

        window.scrollTo({ top: target, behavior: "smooth" });
      });
    });
  };

  // تبويبات القسم في الموبايل (كل الأقسام)
  const mobileTabs = useMemo(
    () =>
      sections.map((s) => ({
        id: s.id,
        label: s.label,
        Icon: s.icon || iconFor(s.id),
      })),
    [sections]
  );

  return (
    <>
      {/* ===== Sidebar (Desktop only - lg and above) ===== */}
      <aside
        className={cn(
          "hidden lg:flex lg:flex-col fixed top-0 bottom-0 w-[19rem] z-40",
          isRTL ? "right-0" : "left-0"
        )}
        aria-label="Profile sidebar"
        style={{
          background: "transparent",
        }}
      >
        <button
          onClick={() => router.push(getLastNonProfilePage())}
          aria-label={t("nav.go_back")}
          title={t("nav.go_back")}
          className={cn(
            "hidden lg:flex fixed top-6 z-[10002] w-9 h-9 rounded-full items-center justify-center border transition-all",
            "bg-white text-[#B8071C] border-[#e5e7eb] shadow-md hover:bg-[#B8071C] hover:text-white"
          )}
          style={{
            top: '1.5rem',
            [isRTL ? 'right' : 'left']: `calc(19rem + 16px)`
          } as React.CSSProperties}
        >
          {isRTL ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="h-4 w-4" />}
        </button>

        <div className="flex flex-col items-center py-8 px-4 space-y-8 flex-1 relative h-full">
          {/* Avatar + name */}
          <div className="flex flex-col items-center gap-2 w-full">
            <div className="relative">
              <Avatar className="w-16 h-16 ring-2 ring-[#fecaca]/60 shadow-md">
                {profilePicture ? (
                  <Image
                    src={profilePicture}
                    alt={username || "User"}
                    fill
                    className="object-cover"
                    unoptimized
                    priority
                  />
                ) : (
                  <AvatarFallback className="bg-[#B8071C] text-white font-bold">
                    {username?.charAt(0)?.toUpperCase() || "U"}
                  </AvatarFallback>
                )}
              </Avatar>

              <ProfilePictureUpload
                userId={userId}
                currentPicture={profilePicture || null}
              />
            </div>
            <div className="text-base font-bold font-serif text-[#008E46] truncate mt-2">
              {username}
            </div>
          </div>

          {/* Menu */}
          <nav className="flex-1 w-full flex flex-col gap-2 mt-6">
            {!isLarge && (
              <button
                onClick={() => router.push(getLastNonProfilePage())}
                title={t("nav.go_back")}
                className={cn(
                  "group flex items-center gap-3 w-full text-left px-3 py-2 rounded-xl transition-all duration-150",
                  "bg-[#f3f4f6] text-[#B8071C] hover:bg-[#B8071C] hover:text-white font-medium"
                )}
                style={{
                  border: "1.5px solid #e5e7eb",
                }}
              >
                <span
                  className={cn(
                    "inline-flex items-center justify-center w-8 h-8 rounded-full transition-all",
                    "bg-white text-[#B8071C] group-hover:bg-white/20 group-hover:text-white"
                  )}
                >
                  {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
                </span>
                <span className="text-base font-medium font-serif truncate">{t("nav.go_back")}</span>
              </button>
            )}

            {sections.map((s) => {
              const Icon = s.icon || iconFor(s.id);
              const isActive = active === s.id;
              const label = getLabel(s.id, s.label);
              return (
                <button
                  key={s.id}
                  onClick={scrollTo(s.id)}
                  title={label}
                  className={cn(
                    "group flex items-center gap-3 w-full text-left px-4 py-3 rounded-2xl transition-all duration-200",
                    isActive
                      ? "bg-white shadow-lg text-[#008E46] font-semibold"
                      : "bg-transparent text-slate-500 hover:bg-white/80 hover:text-[#008E46]"
                  )}
                  aria-current={isActive ? "page" : undefined}
                  style={{
                    border: isActive ? "1.5px solid #caf9e2" : "1.5px solid transparent",
                  }}
                >
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-9 h-9 rounded-xl transition-all",
                      isActive
                        ? "bg-[#008E46]/10 text-[#008E46] shadow-sm"
                        : "bg-slate-100 text-slate-400"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className={`text-base font-serif truncate ${isActive ? "font-bold" : "font-medium"}`}>{label}</span>
                  {typeof s.count === "number" && s.count > 0 && (
                    <span className="ml-auto text-xs bg-[#008E46]/10 px-2.5 py-1 rounded-full text-[#008E46] font-bold">
                      {s.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Bottom actions: Logout */}
          <div className={cn(
            "w-full flex absolute bottom-0 pb-8",
            isRTL ? "justify-start right-0 pr-4" : "justify-start left-0 pl-4"
          )}>
            <button
              onClick={async () => {
                await performGlobalLogout({ redirect: true });
              }}
              className={cn(
                "group flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150",
                "bg-transparent text-[#B8071C] hover:bg-white hover:text-[#008E46] font-medium",
                "border border-transparent"
              )}
              style={{
                border: "1.5px solid transparent",
                height: "44px",
                minHeight: "44px",
              }}
              title={t("profile.logout")}
              aria-label={t("profile.logout")}
            >
              <LogOut className="h-5 w-5" />
              <span className="text-base font-medium font-serif">{t("profile.logout")}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ===== Top Bar + Tabs (Mobile & Tablet) ===== */}
      <nav
        className="lg:hidden fixed inset-x-0 z-50 bg-white/95 backdrop-blur border-b border-[#e5e7eb]"
        style={{ top: 0 }}
        aria-label="Profile header"
      >
        <div className="flex items-center">
          <div className={cn(
            "flex-shrink-0 py-2",
            isRTL ? "pr-2 pl-1" : "pl-2 pr-1"
          )}>
            <button
              onClick={() => router.push(getLastNonProfilePage())}
              className={cn(
                "flex items-center justify-center w-9 h-9 rounded-full border transition-all",
                "bg-[#f3f4f6] text-[#B8071C] border-[#e5e7eb] hover:bg-[#B8071C] hover:text-white hover:border-[#B8071C]"
              )}
              title={t("nav.go_back")}
              aria-label={t("nav.go_back")}
            >
              {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            </button>
          </div>

          <div className="flex-1 overflow-x-auto no-scrollbar">
            <div className="flex gap-1.5 py-2 min-w-max px-1">
              {mobileTabs.map(({ id, label, Icon }) => {
                const isActive = active === id;
                const translatedLabel = getLabel(id, label);
                return (
                  <button
                    key={id}
                    onClick={scrollTo(id)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-bold font-serif whitespace-nowrap border transition-all",
                      isActive
                        ? "bg-[#B8071C] text-white border-[#B8071C] shadow-sm"
                        : "bg-white text-[#4b5563] border-[#e5e7eb] hover:bg-[#f3f4f6]"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isActive ? "text-white" : "text-[#9ca3af]")} />
                    {translatedLabel}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
