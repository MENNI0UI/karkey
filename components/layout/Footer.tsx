"use client";
import { usePathname } from "next/navigation";
import React from "react";
import { useTranslation } from "@/lib/i18n-context";
import { FooterBrand, FooterLinksGroup, FooterBottomBar } from "./footer/footer-components";

export default function Footer() {
  const { t, language } = useTranslation();
  const pathname = usePathname() || "/";

  // Hide footer for auth pages
  if (pathname.startsWith("/auth/register") || pathname.startsWith("/auth/login")) {
    return null;
  }

  // Styles for the heritage pattern
  const patternStyles = `
    .heritage-zellige-pattern {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image: url('/zellige.webp');
      background-repeat: repeat;
      background-size: 400px;
      opacity: 0.12;
      mask-image: radial-gradient(circle at 50% 50%, white 0%, transparent 90%);
      -webkit-mask-image: radial-gradient(circle at 50% 50%, white 0%, transparent 90%);
    }
  `;

  return (
    <footer className="bg-[#fafafa] border-t border-[#ececec] mt-auto relative overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: patternStyles }} />
      <div className="heritage-zellige-pattern" aria-hidden="true" />

      <div className="max-w-7xl 3xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-10">
          <FooterBrand language={language} />

          <FooterLinksGroup
            title={t("footer.marketplace")}
            language={language}
            links={[
              { label: t("nav.auctions"), href: "auctions" },
              { label: t("nav.direct_sales"), href: "direct-sales" },
              { label: t("nav.karkey_cars"), href: "karkey-cars" },
              { label: t("nav.pricing"), href: "plans" },
            ]}
          />

          <FooterLinksGroup
            title={t("footer.company")}
            language={language}
            links={[
              { label: t("nav.about"), href: "about" },
              { label: t("footer.how_it_works"), href: "#" },
              { label: t("footer.careers"), href: "#" },
              { label: t("footer.contact"), href: "#" },
            ]}
          />

          <FooterLinksGroup
            title={t("footer.help")}
            language={language}
            links={[
              { label: t("footer.help_center"), href: "#" },
              { label: t("footer.faq"), href: "#" },
              { label: t("footer.manage_listings"), href: "#" },
              { label: t("footer.account_settings"), href: "#" },
            ]}
          />

          <FooterLinksGroup
            title={t("footer.legal")}
            language={language}
            links={[
              { label: t("footer.terms"), href: "#" },
              { label: t("footer.privacy"), href: "#" },
              { label: t("footer.cookies"), href: "#" },
              { label: t("footer.licenses"), href: "#" },
            ]}
          />

          <FooterLinksGroup
            title={t("footer.social")}
            language={language}
            links={[
              { label: "Facebook", href: "https://facebook.com", external: true },
              { label: "Instagram", href: "https://instagram.com", external: true },
              { label: "X (Twitter)", href: "https://twitter.com", external: true },
              { label: "LinkedIn", href: "https://linkedin.com", external: true },
            ]}
          />
        </div>
      </div>

      <FooterBottomBar />
    </footer>
  );
}
