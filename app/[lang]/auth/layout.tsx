"use client";
import React, { useEffect } from "react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  // Remove any global top/bottom padding added by the shell while on auth pages,
  // but restore previous values when leaving the auth route.
  useEffect(() => {
    const prevTop = document.body.style.paddingTop || "";
    const prevBottom = document.body.style.paddingBottom || "";
    const prevCssVar = document.documentElement.style.getPropertyValue("--site-header-height") || "";

    document.body.style.paddingTop = "0px";
    document.body.style.paddingBottom = "0px";
    document.documentElement.style.setProperty("--site-header-height", "0px");

    return () => {
      document.body.style.paddingTop = prevTop;
      document.body.style.paddingBottom = prevBottom;
      if (prevCssVar) document.documentElement.style.setProperty("--site-header-height", prevCssVar);
      else document.documentElement.style.removeProperty("--site-header-height");
    };
  }, []);

  return (
    <div className="min-h-[70vh] bg-[#f8fafc]">
      {children}
    </div>
  );
}