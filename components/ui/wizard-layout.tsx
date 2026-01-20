"use client";

import React, { useState } from "react";
import { Check, Info, X, PanelRight, HelpCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n-context";
import { motion, AnimatePresence } from "framer-motion";
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer";

export interface WizardStep {
    id: string;
    label: string;
    description?: string;
}

interface WizardLayoutProps {
    readonly steps: readonly WizardStep[];
    readonly currentStep: number;
    readonly children: React.ReactNode;
    readonly title: string;
    readonly subtitle?: string;
    readonly sidebar?: React.ReactNode;
    readonly onStepNav?: (step: number) => void;
}

export function WizardLayout({
    steps,
    currentStep,
    children,
    title,
    subtitle,
    sidebar,
}: WizardLayoutProps) {
    const { dir, t } = useTranslation();
    const isRtl = dir === "rtl";
    const [isGuideVisible, setIsGuideVisible] = useState(false);
    const [isMobileGuideOpen, setIsMobileGuideOpen] = useState(false);

    return (
        <div className="min-h-screen bg-[#f8f9fa] font-serif overflow-x-hidden">
            <motion.div
                className="w-full pt-[85px] lg:pt-8 pb-8 mx-auto px-2 lg:px-4"
                animate={{
                    maxWidth: isGuideVisible ? 1920 : 1240,
                }}
                transition={{
                    duration: 1.5, // Even slower expansion for premium feel
                    ease: [0.165, 0.84, 0.44, 1], // Cinematic easeOutQuart
                }}
            >
                {/* Header - Cinematic Reveal */}
                <motion.div
                    initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{
                        duration: 1.2,
                        ease: [0.22, 1, 0.36, 1]
                    }}
                    className="mb-10 px-4 lg:px-4 flex justify-between items-end"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-[#103090] font-serif tracking-tight">{title}</h1>
                        {subtitle && (
                            <p className="text-base text-gray-500 mt-2 font-sans">{subtitle}</p>
                        )}
                    </div>
                    {sidebar && (
                        <button
                            onClick={() => setIsGuideVisible(!isGuideVisible)}
                            className="hidden xl:flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-full text-sm font-semibold text-[#103090] hover:bg-gray-50 hover:border-[#103090]/30 transition-all shadow-sm hover:shadow-md active:scale-95 group"
                        >
                            <PanelRight className={`w-4 h-4 transition-colors ${isGuideVisible ? "text-[#B8071C]" : "text-gray-400 group-hover:text-[#B8071C]"}`} />
                            <span className="font-sans">
                                {isGuideVisible ? t("common.hide_guide") : t("common.show_guide")}
                            </span>
                        </button>
                    )}
                </motion.div>

                <div className="flex gap-4">
                    {/* Sidebar Progress - Cinematic Reveal */}
                    <motion.div
                        initial={{ opacity: 0, x: -15, filter: "blur(4px)" }}
                        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                        transition={{
                            duration: 1.2,
                            delay: 0.2, // Staggered entry
                            ease: [0.22, 1, 0.36, 1]
                        }}
                        className={`hidden lg:block w-[270px] flex-shrink-0 ${isRtl ? "pr-4 lg:pr-4" : "pl-4 lg:pl-4"} transition-all duration-500`}
                    >
                        <div className="sticky top-8">
                            <div className="relative">
                                {/* Vertical Line */}
                                <div
                                    className={`absolute ${isRtl ? "right-[11px]" : "left-[11px]"} top-[12px] w-[2px] bg-gray-200`}
                                    style={{ height: `calc(100% - 24px)` }}
                                />

                                <div className="space-y-20 relative mt-2">
                                    {steps.map((step, index) => {
                                        const stepNumber = index + 1;
                                        const isCompleted = stepNumber < currentStep;
                                        const isCurrent = stepNumber === currentStep;

                                        // Extracted ternary for better readability
                                        let labelColor = "text-gray-400";
                                        if (isCurrent) {
                                            labelColor = "text-gray-800";
                                        } else if (isCompleted) {
                                            labelColor = "text-gray-500";
                                        }

                                        let indicator;
                                        if (isCompleted) {
                                            indicator = (
                                                <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            );
                                        } else if (isCurrent) {
                                            indicator = (
                                                <div className="w-6 h-6 rounded-full bg-[#B8071C] flex items-center justify-center">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-white" />
                                                </div>
                                            );
                                        } else {
                                            indicator = (
                                                <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white" />
                                            );
                                        }

                                        return (
                                            <div
                                                key={step.id}
                                                className="flex items-center gap-5"
                                            >
                                                {/* Step Indicator */}
                                                <div className="relative z-10">
                                                    {indicator}
                                                </div>

                                                {/* Step Label */}
                                                <span
                                                    className={`text-sm font-semibold tracking-wide uppercase font-serif ${labelColor}`}
                                                >
                                                    {step.label}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-12 pt-6 border-t border-gray-200">
                                <div className="flex items-center justify-between text-sm mb-3">
                                    <span className="text-gray-500 uppercase tracking-wider font-semibold">
                                        {t("wizard.progress.label") || "Progress"}
                                    </span>
                                    <span className="font-bold text-[#B8071C]">
                                        {Math.round(((currentStep - 1) / (steps.length - 1)) * 100)}%
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-[#B8071C] rounded-full transition-all duration-500"
                                        style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Mobile Progress - Fixed below Navbar (76px) */}
                    <div className="lg:hidden fixed top-[76px] left-0 right-0 bg-white/95 backdrop-blur-md border-b border-gray-100 z-[9999] px-4 py-3">
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                    {t("wizard.progress.step_of", { current: currentStep, total: steps.length }) || `Step ${currentStep} of ${steps.length}`}
                                </span>
                                <span className="text-sm text-[#103090] font-bold truncate max-w-[150px]">
                                    {steps[currentStep - 1]?.label}
                                </span>
                            </div>

                            {sidebar && (
                                <Drawer open={isMobileGuideOpen} onOpenChange={setIsMobileGuideOpen}>
                                    <DrawerTrigger asChild>
                                        <button className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#B8071C]/5 border border-[#B8071C]/10 rounded-lg text-xs font-bold text-[#B8071C] active:scale-95 transition-transform">
                                            <HelpCircle className="w-3.5 h-3.5" />
                                            {t("common.guide") || (dir === "rtl" ? "دليل البيع" : "Guide")}
                                        </button>
                                    </DrawerTrigger>
                                    <DrawerContent className="font-serif">
                                        <div className="max-h-[80vh] overflow-y-auto px-6 pb-12">
                                            <DrawerHeader className="px-0 pt-6 pb-4">
                                                <DrawerTitle className="text-2xl font-bold text-[#103090] text-start">
                                                    {t("common.guide") || (dir === "rtl" ? "دليل البيع" : "Selling Guide")}
                                                </DrawerTitle>
                                            </DrawerHeader>
                                            <div className="mt-2">
                                                {sidebar}
                                            </div>
                                        </div>
                                    </DrawerContent>
                                </Drawer>
                            )}
                        </div>
                        <div className="h-1 bg-gray-100 rounded-full mt-2.5 overflow-hidden">
                            <div
                                className="h-full bg-[#B8071C] rounded-full transition-all duration-300"
                                style={{ width: `${(currentStep / steps.length) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Main Content - Cinematic Reveal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, filter: "blur(6px)" }}
                        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                        transition={{
                            duration: 1.2,
                            delay: 0.4, // Staggered entry
                            ease: [0.22, 1, 0.36, 1]
                        }}
                        className="flex-grow min-w-0 px-2 lg:px-4"
                    >
                        {children}
                    </motion.div>

                    {/* Right Sidebar (Guide) - Ultra-smooth entry */}
                    <AnimatePresence mode="popLayout">
                        {sidebar && isGuideVisible && (
                            <motion.div
                                initial={{ opacity: 0, x: isRtl ? -20 : 20, filter: "blur(4px)" }}
                                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                                exit={{
                                    opacity: 0,
                                    x: isRtl ? -150 : 150,
                                    filter: "blur(4px)",
                                    transition: { duration: 0.15, ease: "easeIn" }
                                }}
                                transition={{
                                    duration: 1.2,
                                    delay: 0.2,
                                    ease: [0.22, 1, 0.36, 1]
                                }}
                                className="hidden xl:block w-[360px] shrink-0 sticky top-8 h-fit px-6 lg:px-0"
                            >
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
                                    {sidebar}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
