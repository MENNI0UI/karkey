"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Trash2, GitCompare, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCompare } from "@/hooks/use-comparison";
import { useTranslation } from "@/lib/i18n-context";
import { cn } from "@/lib/utils";

export default function CompareTray() {
    const { vehicles, removeFromCompare, clearComparison, count } = useCompare();
    const { t } = useTranslation();
    const { lang } = useParams();
    const language = String(lang || "en");

    const isVisible = count > 0;

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ y: 100, x: "-50%", opacity: 0 }}
                    animate={{ y: 0, x: "-50%", opacity: 1 }}
                    exit={{ y: 100, x: "-50%", opacity: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 25 }}
                    className={cn(
                        "fixed bottom-6 left-1/2 z-[70]",
                        "px-6 py-4 rounded-[28px]",
                        "bg-[#103090]/80 backdrop-blur-2xl border border-white/10",
                        "shadow-[0_20px_50px_rgba(16,48,144,0.3)]",
                        "flex items-center gap-6"
                    )}
                >
                    {/* Perspective Icon */}
                    <div className="relative group">
                        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-white text-[#103090] shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-transform group-hover:rotate-12 border border-blue-100">
                            <GitCompare className="w-6 h-6 text-[#103090]" />
                        </div>
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#B8071C] text-white text-[10px] font-bold flex items-center justify-center border border-white shadow-sm">
                            {count}
                        </div>
                    </div>

                    {/* Vehicle Thumbnails */}
                    <div className="flex items-center gap-3">
                        {vehicles.map((vehicle, index) => (
                            <motion.div
                                key={`${vehicle.type}-${vehicle.id}`}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="relative group"
                            >
                                <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/20 shadow-lg bg-white/5 transition-transform duration-300 group-hover:-translate-y-1">
                                    {vehicle.photo ? (
                                        <img
                                            src={vehicle.photo}
                                            alt={`${vehicle.make} ${vehicle.model}`}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px] text-center p-1 bg-gradient-to-t from-[#103090] to-transparent">
                                            {vehicle.make}
                                        </div>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#103090]/80 to-transparent" />
                                </div>
                                {/* Remove Button */}
                                <button
                                    onClick={() => removeFromCompare(vehicle.id)}
                                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#B8071C] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:bg-[#910515] active:scale-90"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </motion.div>
                        ))}

                        {/* Empty Slots */}
                        {Array.from({ length: Math.max(0, 4 - count) }).map((_, i) => (
                            <div
                                key={`empty-${i}`}
                                className="w-16 h-16 rounded-2xl border border-dashed border-white/10 bg-white/5 flex flex-col items-center justify-center gap-1 opacity-20 hover:opacity-40 transition-opacity cursor-default"
                            >
                                <span className="text-white text-xl font-light">+</span>
                            </div>
                        ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-4 ms-2 border-s border-white/10 ps-6">
                        <div className="flex flex-col">
                            {count >= 2 ? (
                                <Link
                                    href={`/${language}/compare`}
                                    className={cn(
                                        "flex items-center gap-2.5 px-6 py-3 rounded-2xl",
                                        "bg-[#B8071C] text-white",
                                        "font-serif font-black text-xs uppercase tracking-[0.15em] shadow-[0_10px_20px_rgba(184,7,28,0.2)]",
                                        "hover:bg-[#910515] hover:shadow-[0_10px_25px_rgba(184,7,28,0.3)] hover:-translate-y-0.5 transition-all active:translate-y-0"
                                    )}
                                >
                                    <span>{t("compare.now")}</span>
                                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-white/80" />
                                </Link>
                            ) : (
                                <div className="text-[10px] text-white/40 w-28 font-serif leading-tight italic">
                                    {t("compare.add_more")}
                                </div>
                            )}
                        </div>

                        <button
                            onClick={clearComparison}
                            className="p-3 rounded-2xl text-white/20 hover:text-[#B8071C] hover:bg-white/5 transition-all"
                            title={t("compare.clear")}
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
