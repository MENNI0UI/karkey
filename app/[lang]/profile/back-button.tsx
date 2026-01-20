"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n-context";
import { useEffect, useState } from "react";

// Key for storing last non-profile page
const LAST_PAGE_KEY = "karkey_last_non_profile_page";

// Save current page if it's not a profile page
export function saveLastNonProfilePage() {
  if (typeof window === "undefined") return;

  const currentPath = window.location.pathname;
  // Don't save profile, auth, or admin pages
  const isExcluded = /\/(profile|auth|admin)(\/|$|\?)/.test(currentPath);

  if (!isExcluded) {
    sessionStorage.setItem(LAST_PAGE_KEY, currentPath);
  }
}

// Get the last non-profile page
export function getLastNonProfilePage(): string {
  if (typeof window === "undefined") return "/";
  return sessionStorage.getItem(LAST_PAGE_KEY) || "/";
}

export default function BackButton({
  className = "",
  showPositionWrapper = false,
}: {
  variant?: "text" | "icon";
  label?: string;
  className?: string;
  showPositionWrapper?: boolean;
}) {
  const router = useRouter();
  const { language } = useTranslation();
  const isRTL = language === "ar";
  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;
  const [lastPage, setLastPage] = useState("/");

  // Get the last non-profile page on mount
  useEffect(() => {
    setLastPage(getLastNonProfilePage());
  }, []);

  const goBack = () => {
    // Always go to the last non-profile page
    router.push(lastPage);
  };

  const button = (
    <button
      type="button"
      onClick={goBack}
      aria-label="Go back"
      className={`
        inline-flex items-center justify-center 
        w-9 h-9 sm:w-10 sm:h-10 
        rounded-full 
        bg-white/90 backdrop-blur-sm
        text-[#B8071C] 
        border border-[#e5e7eb]
        hover:bg-[#B8071C] hover:text-white hover:border-[#B8071C]
        shadow-md hover:shadow-lg
        transition-all duration-200
        ${className}
      `}
    >
      <ArrowIcon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
    </button>
  );

  if (showPositionWrapper) {
    return (
      <div className={`fixed top-3 z-[10001] ${isRTL ? "left-3" : "right-3"} sm:top-4 ${isRTL ? "sm:left-4" : "sm:right-4"}`}>
        {button}
      </div>
    );
  }

  return button;
}
