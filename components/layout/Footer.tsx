"use client";
import { usePathname } from "next/navigation";
import React from "react";
import { useTranslation } from "@/lib/i18n-context";
import { FooterBrand, FooterLinksGroup, FooterBottomBar } from "./footer/footer-components";

export default function Footer() {
  const { language } = useTranslation();
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
      background-image: url('/zellige.png');
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
            title="Marketplace"
            language={language}
            links={[
              { label: "Auctions", href: "auctions" },
              { label: "Direct Sales", href: "direct-sales" },
              { label: "Karkey Cars", href: "karkey-cars" },
              { label: "Pricing", href: "plans" },
            ]}
          />

          <FooterLinksGroup
            title="Company"
            language={language}
            links={[
              { label: "About Us", href: "about" },
              { label: "How It Works", href: "#" },
              { label: "Careers", href: "#" },
              { label: "Contact", href: "#" },
            ]}
          />

          <FooterLinksGroup
            title="Help & Information"
            language={language}
            links={[
              { label: "Help Center", href: "#" },
              { label: "FAQ", href: "#" },
              { label: "Manage Listings", href: "#" },
              { label: "Account Settings", href: "#" },
            ]}
          />

          <FooterLinksGroup
            title="Legal"
            language={language}
            links={[
              { label: "Terms of Service", href: "#" },
              { label: "Privacy Policy", href: "#" },
              { label: "Cookie Policy", href: "#" },
              { label: "Licenses", href: "#" },
            ]}
          />

          <FooterLinksGroup
            title="Social"
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
