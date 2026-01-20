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

  // Styles du motif étoilé (CSS uniquement)
  const starPatternStyles = `
    .moroccan-star-pattern {
      --pattern-size: 60px;
      --pattern-color: rgba(65, 87, 163, 0.08);
      position: absolute;
      inset: 0;
      pointer-events: none;
      background-image: linear-gradient(to right, transparent, transparent);
    }
    .moroccan-star-pattern::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: radial-gradient(circle at 50% 50%, transparent 0%, rgba(255, 255, 255, 0.8) 100%);
      mask-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L37.07 7.07L45 0L52.07 7.07L60 15L52.93 22.07L60 29.14V30.86L52.93 37.93L60 45L52.07 52.93L45 60L37.93 52.93L30.86 60H29.14L22.07 52.93L15 60L7.07 52.93L0 45L7.07 37.93L0 30.86V29.14L7.07 22.07L0 15L7.93 7.07L15 0L22.07 7.07L29.14 0H30ZM30 14.14L22.93 21.21L15.86 14.14L14.14 15.86L21.21 22.93L14.14 30L21.21 37.07L14.14 44.14L15.86 45.86L22.93 38.79L30 45.86L37.07 38.79L44.14 45.86L45.86 44.14L38.79 37.07L45.86 30L38.79 22.93L45.86 15.86L44.14 14.14L37.07 21.21L30 14.14Z' fill='none' stroke='black' stroke-width='1' /%3E%3C/svg%3E");
      -webkit-mask-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L37.07 7.07L45 0L52.07 7.07L60 15L52.93 22.07L60 29.14V30.86L52.93 37.93L60 45L52.07 52.93L45 60L37.93 52.93L30.86 60H29.14L22.07 52.93L15 60L7.07 52.93L0 45L7.07 37.93L0 30.86V29.14L7.07 22.07L0 15L7.93 7.07L15 0L22.07 7.07L29.14 0H30ZM30 14.14L22.93 21.21L15.86 14.14L14.14 15.86L21.21 22.93L14.14 30L21.21 37.07L14.14 44.14L15.86 45.86L22.93 38.79L30 45.86L37.07 38.79L44.14 45.86L45.86 44.14L38.79 37.07L45.86 30L38.79 22.93L45.86 15.86L44.14 14.14L37.07 21.21L30 14.14Z' fill='none' stroke='black' stroke-width='1' /%3E%3C/svg%3E");
      mask-repeat: repeat;
      -webkit-mask-repeat: repeat;
      mask-size: var(--pattern-size) var(--pattern-size);
      -webkit-mask-size: var(--pattern-size) var(--pattern-size);
      background: var(--pattern-color);
    }
  `;

  return (
    <footer className="bg-[#fafafa] border-t border-[#ececec] mt-auto relative overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: starPatternStyles }} />
      <div className="moroccan-star-pattern" aria-hidden="true" />

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
