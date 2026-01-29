"use client";

import React from "react";
import { BookOpen, CirclePlus, LogIn, UserPlus, ChevronDown, Plus } from "lucide-react";
import Link from "next/link";
import { AnimatePresence, m } from "framer-motion";
import { useRouter } from "next/navigation";

interface AuthButtonsProps {
    language: string;
    t: any;
}

/**
 * Enhanced Guest Action Pill - Unified for Desktop & Mobile
 * Cycles between "Sell" and "Sign In" with fluid vertical flip.
 */
export const AuthButtons: React.FC<AuthButtonsProps> = ({ language, t }) => {
    return (
        <div className="flex items-center justify-end" id="guest-header-slot">
            <SmartAuthPill language={language} t={t} />
        </div>
    );
};

function SmartAuthPill({ language, t }: { language: string; t: any }) {
    const [index, setIndex] = React.useState(0);
    const [open, setOpen] = React.useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Auto-cycle transition, pause when open
    React.useEffect(() => {
        const timer = setInterval(() => {
            if (!open) {
                setIndex((prev) => (prev + 1) % 2);
            }
        }, 5000);
        return () => clearInterval(timer);
    }, [open]);

    // Outside click handler for dropdown
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleAction = () => {
        if (index === 0) {
            setOpen(!open);
        } else {
            router.push(`/${language}/auth/login`);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <m.button
                layout
                onClick={handleAction}
                className={`flex items-center gap-2 group/pill rounded-full font-serif transition-all duration-700 border border-transparent relative overflow-hidden
                    /* Responsive Sizing */
                    h-[38px] px-3.5 min-w-[90px] md:h-[50px] md:px-7 md:min-w-[150px] lg:h-[46px] lg:px-6 lg:min-w-[190px]
                    /* State Styling */
                    ${index === 0
                        ? (open ? "bg-[#009247] text-white shadow-md scale-[1.02]" : "bg-[#00A651] text-white shadow-lg shadow-[#00A651]/20")
                        : "bg-white border-gray-100 text-[#1e2a5e] shadow-xl shadow-black/5 hover:border-gray-200"
                    }`}
                transition={{
                    layout: { type: "spring", stiffness: 260, damping: 25 },
                }}
            >
                {/* Visual Feedback Overlay */}
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/pill:opacity-100 transition-opacity pointer-events-none" />

                <AnimatePresence mode="wait" initial={false}>
                    <m.div
                        key={index}
                        initial={{ y: 24, opacity: 0, filter: "blur(5px)", scale: 0.95 }}
                        animate={{ y: 0, opacity: 1, filter: "blur(0px)", scale: 1 }}
                        exit={{ y: -24, opacity: 0, filter: "blur(5px)", scale: 0.95 }}
                        transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            mass: 0.8,
                            filter: { duration: 0.4 }
                        }}
                        className="flex items-center gap-2 w-full justify-center"
                    >
                        {index === 0 ? (
                            <>
                                <Plus className="w-3.5 h-3.5 md:w-5 md:h-5 lg:w-4 lg:h-4 shrink-0 transition-transform group-hover/pill:rotate-90 duration-500" strokeWidth={3} />
                                <span className="font-bold tracking-tight text-[13px] md:text-[16px] lg:text-[15px] whitespace-nowrap">
                                    <span className="lg:hidden">{t("nav.sell") || "Sell"}</span>
                                    <span className="hidden lg:inline">{t("nav.sell_your_car") || "Sell Your Car"}</span>
                                </span>
                                <ChevronDown className={`w-3 h-3 md:w-5 md:h-5 lg:w-4 lg:h-4 shrink-0 transition-transform duration-500 ${open ? "rotate-180" : ""}`} strokeWidth={2.5} />
                            </>
                        ) : (
                            <>
                                <LogIn className={`w-3.5 h-3.5 md:w-5 md:h-5 lg:w-4 lg:h-4 shrink-0 ${index === 1 ? "text-[#00A651]" : "text-primary"}`} />
                                <span className="font-bold tracking-tight text-[13px] md:text-[16px] lg:text-[15px] whitespace-nowrap">
                                    <span className="lg:hidden">{t("nav.signin") || "Sign In"}</span>
                                    <span className="hidden lg:inline">{t("nav.signin") || "Sign In to Karkey"}</span>
                                </span>
                            </>
                        )}
                    </m.div>
                </AnimatePresence>
            </m.button>

            {/* Dropdown Menu - Responsive */}
            {open && index === 0 && (
                <div className="absolute top-full ltr:right-0 rtl:left-0 mt-3 w-[85vw] max-w-[340px] lg:w-[380px] bg-white rounded-3xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.18)] border border-gray-100/50 overflow-hidden z-[1000] animate-in fade-in slide-in-from-top-4 duration-500 ring-1 ring-black/5">
                    <div className="p-4 space-y-2.5">
                        <div className="px-3 py-1 flex items-center gap-3">
                            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gray-200"></span>
                            <span className="text-[10px] lg:text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">{t("nav.sell") || "SELLING"}</span>
                            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gray-200"></span>
                        </div>

                        <Link
                            href={`/${language}/sell-guide`}
                            className="flex items-start gap-4 p-4 rounded-2xl hover:bg-[#f3f6ff] transition-all duration-300 group/item border border-transparent hover:border-blue-100"
                            onClick={() => setOpen(false)}
                        >
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#1e2a5e]/5 flex items-center justify-center text-[#1e2a5e] group-hover/item:bg-[#1e2a5e] group-hover/item:text-white transition-all duration-300 shadow-sm group-hover/item:shadow-blue-900/10 group-hover/item:scale-110">
                                <BookOpen className="w-6 h-6" strokeWidth={1.5} />
                            </div>
                            <div className="flex-1">
                                <div className="text-[15px] font-bold text-[#1e2a5e] mb-0.5 group-hover/item:text-blue-700 transition-colors uppercase tracking-tight">{t("sell.how_it_works") || "How it works"}</div>
                                <div className="text-[13px] text-gray-400 group-hover/item:text-gray-500 leading-snug font-medium transition-colors">Full guide to vehicle selling</div>
                            </div>
                        </Link>

                        <Link
                            href={`/${language}/direct-sales/create`}
                            className="flex items-start gap-4 p-4 rounded-2xl hover:bg-[#fff5f5] transition-all duration-300 group/item border border-transparent hover:border-red-100"
                            onClick={() => setOpen(false)}
                        >
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-[#B8071C]/5 flex items-center justify-center text-[#B8071C] group-hover/item:bg-[#B8071C] group-hover/item:text-white transition-all duration-300 shadow-sm group-hover/item:shadow-red-900/10 group-hover/item:scale-110">
                                <CirclePlus className="w-6 h-6" strokeWidth={1.5} />
                            </div>
                            <div className="flex-1">
                                <div className="text-[15px] font-bold text-[#1e2a5e] mb-0.5 group-hover/item:text-[#B8071C] transition-colors uppercase tracking-tight">{t("sell.create_listing") || "Create Listing"}</div>
                                <div className="text-[13px] text-gray-400 group-hover/item:text-gray-500 leading-snug font-medium transition-colors">Post your car in minutes</div>
                            </div>
                        </Link>
                    </div>

                    {/* Auth Section - Unified for all devices */}
                    <div className="bg-gray-50/80 backdrop-blur-sm p-4 lg:p-5 border-t border-gray-100">
                        <div className="grid grid-cols-2 gap-3 lg:gap-4">
                            <Link
                                href={`/${language}/auth/login`}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-[13px] lg:text-[14px] font-bold text-[#1e2a5e] hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm hover:shadow-md group/auth"
                                onClick={() => setOpen(false)}
                            >
                                <LogIn className="w-4 h-4 text-gray-400 group-hover/auth:text-[#1e2a5e] transition-colors" />
                                <span>{t("nav.signin") || "Sign In"}</span>
                            </Link>
                            <Link
                                href={`/${language}/auth/register`}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#B8071C] text-[13px] lg:text-[14px] font-bold text-white hover:bg-[#9a0618] transition-all shadow-sm hover:shadow-md hover:shadow-[#B8071C]/20"
                                onClick={() => setOpen(false)}
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

// Support functions removed or integrated into unified SmartAuthPill
