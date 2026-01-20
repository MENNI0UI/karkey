"use client";

import { useEffect, useMemo, useState } from "react";

import { useTranslation } from "@/lib/i18n-context";

/**
 * NOTE:
 * هذا المكوّن مُعطّل على الهاتف لأن لدينا Bottom Nav في `profile-menu.tsx`.
 * إذا رغبت باستخدامه كشرائط نصّية علوية على التابلت فقط:
 * - غيّر الكلاس من `hidden` إلى `sm:block md:hidden` مثلاً.
 */
export default function ProfileMobileMenu({
  sections,
}: {
  sections: { id: string; label: string; count?: number }[];
}) {
  const { t } = useTranslation();
  const [active, setActive] = useState<string | null>(null);
  const ids = useMemo(() => sections.map((s) => s.id), [sections]);

  const getLabel = (id: string, fallbackLabel: string) => {
    const labelMap: Record<string, string> = {
      "personal-info": t("nav.my_profile"),
      "verification": t("nav.verification"),
      "listings": t("nav.my_listings"),
      "favorites": t("nav.my_favorites"),
    };
    return labelMap[id] || fallbackLabel;
  };

  useEffect(() => {
    const sync = () => {
      const id = window.location.hash.replace("#", "") || "personal-info";
      setActive(ids.includes(id) ? id : "personal-info");
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, [ids]);

  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (window.location.hash !== `#${id}`) window.location.hash = id;
    setActive(id);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  };

  // مخفي على كل المقاسات افتراضيًا لأن الـ Bottom Nav هو المعتمد على الهاتف الآن
  return (
    <div className="hidden">
      <div className="sticky top-16 z-10 border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="relative overflow-x-auto no-scrollbar">
          <nav className="flex items-center gap-2 px-4 py-3">
            {sections.map((s) => {
              const isActive = active === s.id;
              return (
                <button
                  key={s.id}
                  onClick={scrollTo(s.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "shrink-0 px-4 py-2 rounded-full text-sm transition-colors border",
                    isActive
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 hover:bg-gray-800 hover:text-white border-gray-200",
                  ].join(" ")}
                >
                  <span className="font-medium whitespace-nowrap">
                    {getLabel(s.id, s.label)}
                    {typeof s.count === "number" && s.count > 0 ? ` (${s.count})` : ""}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
