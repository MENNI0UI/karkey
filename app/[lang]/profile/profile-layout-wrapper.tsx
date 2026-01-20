"use client";

import { useTranslation } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

export default function ProfileLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { language } = useTranslation();
  const isRTL = language === "ar";

  return (
    <div className={cn(
      // Sidebar padding only on lg screens and above
      isRTL ? "lg:pr-[19rem] lg:pl-0" : "lg:pl-[19rem] lg:pr-0"
    )}>
      {children}
    </div>
  );
}
