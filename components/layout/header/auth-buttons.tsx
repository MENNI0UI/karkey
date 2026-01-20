"use client";

import React from "react";
import { BookOpen, CirclePlus, LogIn, UserPlus, ChevronDown } from "lucide-react";
import Link from "next/link";

interface AuthButtonsProps {
    language: string;
    t: any;
}

export const AuthButtons: React.FC<AuthButtonsProps> = ({ language, t }) => {
    return (
        <div className="flex items-center gap-2" id="guest-header-slot">
            <SellYourCarDropdown language={language} t={t} />
        </div>
    );
};

function SellYourCarDropdown({ language, t }: { language: string, t: any }) {
    const [open, setOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[15px] font-serif transition-all shadow-sm duration-300 border border-transparent
                    ${open
                        ? "bg-[#009247] text-white shadow-md scale-[1.02]"
                        : "bg-[#00A651] text-white hover:bg-[#009247] hover:shadow-lg hover:shadow-[#00A651]/20"
                    }`}
            >
                <span className="font-semibold tracking-wide">{t("nav.sell_your_car") || "Sell Your Car"}</span>
                <ChevronDown
                    className={`w-4 h-4 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
                    strokeWidth={2.5}
                />
            </button>

            {open && (
                <div className="absolute top-full right-0 mt-3 w-[360px] bg-white rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-gray-100/50 overflow-hidden z-50 animate-in fade-in slide-in-from-top-3 duration-300 ring-1 ring-black/5">
                    {/* Selling Section */}
                    <div className="p-3 space-y-2">
                        <div className="px-3 py-2 flex items-center gap-2">
                            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200"></span>
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">{t("nav.sell") || "SELLING"}</span>
                            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200"></span>
                        </div>

                        <Link href={`/${language}/sell-guide`} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gradient-to-br hover:from-[#f8f9ff] hover:to-white transition-all duration-300 group ring-1 ring-transparent hover:ring-blue-100/50 hover:shadow-sm">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#1e2a5e]/5 flex items-center justify-center text-[#1e2a5e] group-hover:bg-[#1e2a5e] group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-[#1e2a5e]/20 group-hover:scale-110">
                                <BookOpen className="w-6 h-6" strokeWidth={1.5} />
                            </div>
                            <div className="flex-1">
                                <div className="text-[15px] font-bold text-[#1e2a5e] mb-0.5">{t("sell.how_it_works") || "How it works"}</div>
                                <div className="text-[13px] text-gray-500 leading-snug">Step-by-step guide to selling your car</div>
                            </div>
                        </Link>

                        <Link href={`/${language}/direct-sales/create`} className="flex items-start gap-4 p-4 rounded-2xl hover:bg-gradient-to-br hover:from-[#fff0f0] hover:to-white transition-all duration-300 group ring-1 ring-transparent hover:ring-red-100/50 hover:shadow-sm">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#B8071C]/5 flex items-center justify-center text-[#B8071C] group-hover:bg-[#B8071C] group-hover:text-white transition-all duration-300 shadow-sm group-hover:shadow-[#B8071C]/20 group-hover:scale-110">
                                <CirclePlus className="w-6 h-6" strokeWidth={1.5} />
                            </div>
                            <div className="flex-1">
                                <div className="text-[15px] font-bold text-[#1e2a5e] mb-0.5 group-hover:text-[#B8071C] transition-colors">{t("sell.create_listing") || "Create Listing"}</div>
                                <div className="text-[13px] text-gray-500 leading-snug">List your car for sale independently</div>
                            </div>
                        </Link>
                    </div>

                    {/* Auth Section */}
                    <div className="bg-gray-50/80 backdrop-blur-sm p-4 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-3">
                            <Link
                                href={`/${language}/auth/login`}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[14px] font-bold text-[#1e2a5e] hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm hover:shadow-md group"
                            >
                                <LogIn className="w-4 h-4 text-gray-400 group-hover:text-[#1e2a5e] transition-colors" />
                                <span>{t("nav.signin") || "Sign In"}</span>
                            </Link>
                            <Link
                                href={`/${language}/auth/register`}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#B8071C] text-[14px] font-bold text-white hover:bg-[#9a0618] transition-all shadow-sm hover:shadow-md hover:shadow-[#B8071C]/20"
                            >
                                <UserPlus className="w-4 h-4" />
                                <span>{t("nav.signup") || "Sign Up"}</span>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
