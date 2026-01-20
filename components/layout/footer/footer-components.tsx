"use client";

import Link from "next/link";
import React from "react";

interface FooterLinksGroupProps {
    title: string;
    links: Array<{ label: string; href: string; external?: boolean }>;
    language: string;
}

export function FooterLinksGroup({ title, links, language }: FooterLinksGroupProps) {
    return (
        <div>
            <h4 className="text-[11px] font-semibold text-[#717171] uppercase tracking-wider mb-4">
                {title}
            </h4>
            <ul className="space-y-3">
                {links.map((link, idx) => (
                    <li key={idx}>
                        {link.external ? (
                            <a
                                href={link.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[14px] text-[#9ca3af] hover:text-[#B8071C] transition-colors"
                            >
                                {link.label}
                            </a>
                        ) : (
                            <Link
                                href={link.href.startsWith("/") ? link.href : `/${language}/${link.href}`}
                                className="text-[14px] text-[#9ca3af] hover:text-[#B8071C] transition-colors"
                            >
                                {link.label}
                            </Link>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export function FooterBrand({ language }: { language: string }) {
    return (
        <div className="col-span-2 md:col-span-3 lg:col-span-1 mb-4 lg:mb-0">
            <Link href={`/${language}/`} className="inline-block mb-5">
                <span className="font-display text-[26px] font-extrabold leading-none tracking-tight text-[#B8071C]">
                    Karkey
                </span>
            </Link>
            <p className="text-[13px] text-[#9ca3af] leading-relaxed max-w-[240px]">
                Morocco's premier marketplace for buying and selling quality vehicles through secure auctions.
            </p>
        </div>
    );
}

export function FooterBottomBar() {
    return (
        <div className="border-t border-[#ececec]">
            <div className="max-w-7xl 3xl:max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-[13px] text-[#9ca3af]">
                        © {new Date().getFullYear()} Karkey. All rights reserved.
                    </p>
                    <div className="flex items-center gap-6">
                        {["Privacy Policy", "Terms of Use", "Legal", "Site Map"].map((text) => (
                            <Link key={text} href="#" className="text-[13px] text-[#9ca3af] hover:text-[#6b7280] transition-colors">
                                {text}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
