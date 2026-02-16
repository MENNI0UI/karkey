"use client";

import React, { useMemo, use, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCompare, CompareVehicle } from "@/hooks/use-comparison";
import { useTranslation } from "@/lib/i18n-context";
import { ArrowLeft, Check, Share2, Trash2, X, GitCompare, MapPin, Gauge, Settings2, Fuel, Zap, Sparkles, Trophy, Download, Copy, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CompareTableSkeleton } from "@/components/ui/compare-skeleton";
import { toast } from "@/hooks/use-toast";

// --- Header Content Sub-component for performance ---
const HeaderContent = ({ vehicles, t, isFixed, removeFromCompare }: { vehicles: any[], t: any, isFixed: boolean, removeFromCompare: (id: string) => void }) => {
    return (
        <>
            <div className={cn(
                "p-4 md:p-8 flex items-center justify-center border-r border-gray-50 bg-gray-50/50 sticky left-0 z-[75]",
                !isFixed && "backdrop-blur-xl",
                isFixed && "shadow-r bg-gray-50"
            )}>
                <div className="text-center">
                    <GitCompare className="w-8 h-8 md:w-10 md:h-10 text-[#B8071C] mx-auto mb-2" />
                    <span className="block text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-bold text-[#103090]/40 leading-none">{t("compare.perspective")}</span>
                </div>
            </div>

            {Array.from({ length: 4 }).map((_, i) => {
                const v = vehicles[i];
                return (
                    <div key={i} className={cn("p-6 relative group transition-all duration-500", !v && "bg-gray-50/20")}>
                        {v ? (
                            <div className="flex flex-col gap-4">
                                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-lg border border-white/50 bg-[#103090]/5">
                                    <img src={v.photo} alt={v.make} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#103090]/60 to-transparent opacity-60" />
                                    <button
                                        onClick={() => removeFromCompare(v.id)}
                                        className="absolute top-2 right-2 w-8 h-8 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-red-500 shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                    <div className="absolute bottom-2 left-3 flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-[#B8071C] text-white text-[9px] font-bold uppercase tracking-wider shadow-lg">
                                        {v.type === "sale" ? t("nav.direct_sales") : v.type === "auction" ? t("nav.auctions") : t("nav.karkey_cars")}
                                    </div>
                                </div>
                                <div className="text-center px-2">
                                    <h3 className="italic font-serif font-bold text-[#103090] text-lg md:text-xl leading-tight mb-1 truncate">{v.make}</h3>
                                    <p className="italic font-serif text-[10px] uppercase tracking-widest font-bold text-[#103090]/40 truncate">{v.model}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Link href={v.url} className="flex-1 py-3 bg-[#103090] text-white rounded-xl text-[10px] font-bold uppercase tracking-wider hover:bg-[#B8071C] transition-all text-center flex items-center justify-center shadow-lg shadow-[#103090]/10">
                                        {t("common.view")}
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full min-h-[120px] border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center gap-3 transition-colors hover:border-[#103090]/30 group/add">
                                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 group-hover/add:bg-[#103090]/10 group-hover/add:text-[#103090] transition-all">
                                    <span className="text-xl font-light">+</span>
                                </div>
                                <span className="text-[9px] uppercase tracking-widest font-bold text-gray-300 group-hover/add:text-[#103090]">{t("compare.awaiting")}</span>
                            </div>
                        )}
                    </div>
                );
            })}
        </>
    );
};

// --- Multi-language Markdown Parser Component ---
const MarkdownText = ({ content, language }: { content: string, language: string }) => {
    const isAr = language === 'ar';

    // Split by potential table blocks or normal text
    const blocks = useMemo(() => {
        const result: { type: 'text' | 'table'; content: string }[] = [];
        const lines = content.split('\n');
        let currentTable: string[] = [];

        for (const line of lines) {
            if (line.trim().startsWith('|')) {
                currentTable.push(line);
            } else {
                if (currentTable.length > 0) {
                    result.push({ type: 'table', content: currentTable.join('\n') });
                    currentTable = [];
                }
                if (line.trim().length > 0) {
                    result.push({ type: 'text', content: line });
                }
            }
        }
        if (currentTable.length > 0) {
            result.push({ type: 'table', content: currentTable.join('\n') });
        }
        return result;
    }, [content]);

    const renderTable = (tableContent: string) => {
        const rows = tableContent.split('\n').filter(r => r.trim().includes('|'));
        const htmlRows = rows.map(row => row.split('|').filter(cell => cell.trim().length > 0 || row.indexOf(cell) > 0 && row.indexOf(cell) < row.lastIndexOf('|')));

        // Basic check for header separator row |---|---|
        const filteredRows = htmlRows.filter(row => !row.every(cell => cell.trim().match(/^[:\s-]*$/)));

        return (
            <div className="my-6 overflow-hidden rounded-2xl border border-blue-100 shadow-sm bg-white/50 backdrop-blur-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm font-serif">
                        <tbody className="divide-y divide-blue-50">
                            {filteredRows.map((row, rIdx) => (
                                <tr key={rIdx} className={cn(
                                    "transition-colors hover:bg-white/80",
                                    rIdx === 0 && "bg-[#103090]/5 font-bold"
                                )}>
                                    {row.map((cell, cIdx) => (
                                        <td key={cIdx} className={cn(
                                            "p-4 border-r border-blue-50/50 last:border-r-0",
                                            isAr ? "text-right" : "text-left"
                                        )}>
                                            {cell.trim().replace(/\*\*(.*?)\*\*/g, '$1')}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div
            className={cn(
                "space-y-4 font-serif text-[#103090]/90",
                isAr ? "font-arabic" : ""
            )}
            dir={isAr ? "rtl" : "ltr"}
        >
            {blocks.map((block, idx) => {
                if (block.type === 'table') {
                    return <div key={idx}>{renderTable(block.content)}</div>;
                }

                // Parse bold: **text** -> <strong>text</strong>
                const parts = block.content.split(/(\*\*.*?\*\*)/g);
                return (
                    <p key={idx} className="leading-relaxed text-base md:text-lg">
                        {parts.map((part, pIdx) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                                return (
                                    <strong key={pIdx} className="text-[#103090] font-black border-b-2 border-[#DEB735]/30">
                                        {part.slice(2, -2)}
                                    </strong>
                                );
                            }
                            return part;
                        })}
                    </p>
                );
            })}
        </div>
    );
};

export default function ComparePage(props: { params: Promise<{ lang: string }> }) {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white" />}>
            <CompareContent {...props} />
        </Suspense>
    );
}

function CompareContent({ params }: { params: Promise<{ lang: string }> }) {
    const { lang } = use(params);
    const searchParams = useSearchParams();
    const { vehicles, removeFromCompare, clearComparison, addMany } = useCompare();
    const { t } = useTranslation();
    const [showOnlyDifferences, setShowOnlyDifferences] = React.useState(false);
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const [aiSummary, setAiSummary] = React.useState<string | null>(null);
    const [aiOutputLang, setAiOutputLang] = React.useState<string>(lang);
    const [isLanguageModalOpen, setIsLanguageModalOpen] = React.useState(false);
    const [isSharingImage, setIsSharingImage] = React.useState(false);
    const [isLoadingInitial, setIsLoadingInitial] = React.useState(true);

    // Sync URL ids to comparison state
    React.useEffect(() => {
        const ids = searchParams.get('ids');
        if (ids) {
            setIsLoadingInitial(true);
            fetch(`/api/vehicles/batch?ids=${ids}`)
                .then(res => res.json())
                .then(data => {
                    if (data.vehicles && data.vehicles.length > 0) {
                        addMany(data.vehicles);
                    }
                })
                .catch(err => console.error("Failed to sync shared comparison:", err))
                .finally(() => setIsLoadingInitial(false));
        } else {
            setIsLoadingInitial(false);
        }
    }, [searchParams, addMany]);

    // Header scroll effect with performance optimizations
    const [showFixedHeader, setShowFixedHeader] = React.useState(false);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const flowHeaderRef = React.useRef<HTMLDivElement>(null);
    const fixedHeaderRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        let frameId: number;

        // Sync fixed header horizontal scroll with table body
        const syncScroll = () => {
            if (scrollContainerRef.current && fixedHeaderRef.current) {
                const scrollLeft = scrollContainerRef.current.scrollLeft;
                fixedHeaderRef.current.style.transform = `translate3d(${-scrollLeft}px, 0, 0)`;
            }
        };

        const handleHorizontalScroll = () => {
            cancelAnimationFrame(frameId);
            frameId = requestAnimationFrame(syncScroll);
        };

        // Use IntersectionObserver to toggle fixed header visibility
        const observer = new IntersectionObserver(
            ([entry]) => {
                // If the flow header is not visible (scrolled past), show the fixed header
                setShowFixedHeader(!entry.isIntersecting && entry.boundingClientRect.top < 0);
            },
            { threshold: 0, rootMargin: '-76px 0px 0px 0px' } // 76px is the navbar height
        );

        if (flowHeaderRef.current) {
            observer.observe(flowHeaderRef.current);
        }

        const scrollEl = scrollContainerRef.current;
        if (scrollEl) {
            scrollEl.addEventListener('scroll', handleHorizontalScroll, { passive: true });
        }

        return () => {
            observer.disconnect();
            if (scrollEl) {
                scrollEl.removeEventListener('scroll', handleHorizontalScroll);
            }
            cancelAnimationFrame(frameId);
        };
    }, []);

    // Logic to determine if a row should be hidden
    const isDifferent = (key: keyof CompareVehicle | string) => {
        if (vehicles.length < 2) return true;
        const firstValue = (vehicles[0] as any)[key];
        return vehicles.some(v => (v as any)[key] !== firstValue);
    };

    const handleShare = async () => {
        if (typeof globalThis.window === "undefined") return;
        const ids = vehicles.map(v => v.id).join(",");
        const shareUrl = `${globalThis.window.location.origin}${globalThis.window.location.pathname}?ids=${ids}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Karkey Comparison',
                    text: 'Check out these vehicles on Karkey!',
                    url: shareUrl,
                });
            } catch (err) {
                copyToClipboard(shareUrl);
            }
        } else {
            copyToClipboard(shareUrl);
        }
    };

    const handleShareAsImage = async () => {
        setIsSharingImage(true);
        try {
            const ids = vehicles.map(v => v.id).join(",");
            const response = await fetch(`/api/share/image?ids=${ids}&lang=${lang}`);
            if (!response.ok) throw new Error("Failed to generate image");

            const blob = await response.blob();

            // Download the image directly
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `karkey-comparison-${Date.now()}.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Image share failed:", error);
            alert(lang === 'ar'
                ? "فشل إنشاء الصورة: " + (error instanceof Error ? error.message : String(error))
                : "Failed to generate image: " + (error instanceof Error ? error.message : String(error))
            );
        } finally {
            setIsSharingImage(false);
        }
    };

    const copyToClipboard = (url: string) => {
        navigator.clipboard.writeText(url);
        toast({
            title: t("compare.share_link_copied"),
            duration: 3000,
        });
    };

    const copySummary = () => {
        if (!aiSummary) return;
        navigator.clipboard.writeText(aiSummary);
        toast({
            title: lang === 'ar' ? "تم نسخ الملخص!" : "Summary copied!",
            duration: 3000,
        });
    };

    const handleAIAnalysis = async (selectedLang: string) => {
        console.log("Analyzing in language:", selectedLang);
        setIsLanguageModalOpen(false);
        setIsAnalyzing(true);
        setAiSummary(null);
        try {
            const response = await fetch('/api/ai/compare', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ vehicles, language: selectedLang })
            });
            const data = await response.json();
            if (data.summary) {
                setAiOutputLang(selectedLang);
                setAiSummary(data.summary);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Helper to format price
    const formatPrice = (price: number) => {
        return new Intl.NumberFormat(lang === "ar" ? "ar-MA" : "fr-MA", {
            style: "decimal",
            maximumFractionDigits: 0,
        }).format(price);
    };

    // Calculate "Best in Class"
    const highlights = useMemo(() => {
        if (vehicles.length < 2) return {};

        const lowestPrice = Math.min(...vehicles.map(v => v.price));
        const lowestMileage = Math.min(...vehicles.map(v => v.mileage || Infinity));
        const newestYear = Math.max(...vehicles.map(v => v.year));

        return {
            price: vehicles.filter(v => v.price === lowestPrice).map(v => v.id),
            mileage: vehicles.filter(v => (v.mileage || Infinity) === lowestMileage).map(v => v.id),
            year: vehicles.filter(v => v.year === newestYear).map(v => v.id),
        };
    }, [vehicles]);

    if (isLoadingInitial) {
        return <CompareTableSkeleton />;
    }

    if (vehicles.length === 0) {
        return (
            <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 bg-[#F8F9FA]">
                <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-8 shadow-2xl border border-gray-100">
                    <Settings2 className="w-12 h-12 text-[#103090] opacity-50" />
                </div>
                <h1 className="text-3xl font-bold font-serif text-[#103090] mb-3">{t("compare.empty")}</h1>
                <p className="text-gray-500 mb-10 max-w-md text-lg italic">
                    {t("compare.add_more")}
                </p>
                <Link
                    href={`/${lang}`}
                    className="bg-[#103090] text-white px-10 py-4 rounded-full font-bold font-serif hover:bg-[#B8071C] transition-all shadow-xl hover:scale-105 active:scale-95 border border-[#DEB735]/20"
                >
                    {t("compare.collections")}
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFDFD] pb-24">
            {/* Premium Header */}
            <div className="bg-[#103090] text-white pt-12 pb-24 md:pb-32 px-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-white/5 to-transparent skew-x-12 opacity-50" />

                <div className="container mx-auto max-w-7xl relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-center md:text-left">
                            <Link href={`/${lang}`} className="text-[#DEB735] hover:text-white flex items-center gap-2 mb-4 transition-colors font-medium group">
                                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                {t("compare.view_portfolio")}
                            </Link>
                            <h1 className="text-4xl lg:text-7xl font-bold font-serif mb-2 tracking-tight">
                                {t("compare.title")}
                            </h1>
                            <p className="text-blue-100/60 font-serif italic text-lg lg:text-xl">
                                {t("compare.analytical_desc")}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-4 bg-white/5 p-2 rounded-2xl backdrop-blur-md border border-white/10 shadow-2xl">
                            <button
                                onClick={() => setIsLanguageModalOpen(true)}
                                disabled={isAnalyzing}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-xl text-white transition-all border border-white/10 overflow-hidden relative group",
                                    isAnalyzing ? "bg-white/20 animate-pulse" : "bg-gradient-to-br from-[#DEB735] to-[#B8860B] hover:scale-105"
                                )}
                            >
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                                <Zap className={cn("w-5 h-5", isAnalyzing && "animate-spin")} />
                                <span className="font-serif font-bold whitespace-nowrap">
                                    {isAnalyzing ? t("compare.ai_analyzing") : t("compare.ai_analyze")}
                                </span>
                            </button>

                            <button
                                onClick={handleShareAsImage}
                                disabled={isSharingImage}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 bg-[#DEB735]/10 rounded-xl text-yellow-500 hover:bg-[#DEB735]/20 transition-all border border-yellow-500/30 font-bold",
                                    isSharingImage && "animate-pulse"
                                )}
                            >
                                <Download className={cn("w-5 h-5", isSharingImage && "animate-bounce")} />
                                <span className="font-serif">
                                    {isSharingImage ? t("common.loading") : t("compare.export_pdf")}
                                </span>
                            </button>

                            <button
                                onClick={() => setShowOnlyDifferences(!showOnlyDifferences)}
                                className={cn(
                                    "flex items-center gap-2 px-6 py-3 rounded-xl transition-all border font-serif font-bold",
                                    showOnlyDifferences
                                        ? "bg-white text-[#103090] border-white shadow-lg"
                                        : "bg-white/5 text-white border-white/10 hover:bg-white/10"
                                )}
                            >
                                <Settings2 className="w-5 h-5" />
                                <span className="whitespace-nowrap">
                                    {showOnlyDifferences ? t("compare.show_all") : t("compare.only_differences")}
                                </span>
                            </button>

                            <div className="w-px h-8 bg-white/10 hidden sm:block mx-2" />

                            <button
                                onClick={clearComparison}
                                className="p-3 text-red-100 hover:bg-red-500/20 hover:text-red-400 rounded-xl transition-all"
                                title={t("compare.clear")}
                            >
                                <Trash2 className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </div >

            {/* 1. Optimized Fixed Overlay Header (Only shows when needed) */}
            {
                showFixedHeader && (
                    <div className="fixed top-[76px] left-0 right-0 z-[60] animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-none">
                        <div className="container mx-auto px-4 max-w-7xl">
                            <div
                                ref={fixedHeaderRef}
                                className="grid grid-cols-[180px_repeat(4,280px)] md:grid-cols-[260px_repeat(4,1fr)] bg-white shadow-2xl border-x border-b border-gray-100 rounded-b-2xl py-4 pointer-events-auto will-change-transform"
                                style={{
                                    width: 'fit-content',
                                    minWidth: '1000px',
                                    backfaceVisibility: 'hidden'
                                }}
                            >
                                <HeaderContent vehicles={vehicles} t={t} isFixed={true} removeFromCompare={removeFromCompare} />
                            </div>
                        </div>
                    </div>
                )
            }

            {/* AI Summary Box */}
            {
                aiSummary && (
                    <div className="container mx-auto px-4 max-w-7xl mt-8">
                        <div className="bg-gradient-to-br from-white via-blue-50/30 to-white rounded-[40px] p-8 md:p-12 border border-blue-100 shadow-2xl relative overflow-hidden group animate-in fade-in slide-in-from-top-4 duration-700">
                            {/* Decorative dynamic elements */}
                            <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-100/20 rounded-full blur-3xl" />
                            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-[#DEB735]/10 rounded-full blur-3xl" />

                            <div className="absolute top-0 right-0 p-6 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-1000 rotate-12">
                                <Zap className="w-48 h-48 text-[#103090]" />
                            </div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-4 mb-8">
                                    <div className="p-4 bg-gradient-to-br from-[#103090] to-[#0A1E5C] rounded-[22px] text-white shadow-xl shadow-[#103090]/20 relative">
                                        <Sparkles className="w-7 h-7" />
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#DEB735] rounded-full animate-ping" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl md:text-3xl font-black font-serif text-[#103090] tracking-tight">{t("compare.ai_summary")}</h2>
                                        <div className="h-1 w-12 bg-gradient-to-r from-[#DEB735] to-transparent rounded-full mt-1" />
                                    </div>
                                    <button
                                        onClick={copySummary}
                                        className="ml-auto p-3 text-blue-400 hover:text-[#103090] hover:bg-blue-50 rounded-full transition-all duration-300 flex items-center gap-2 px-4 border border-blue-50"
                                    >
                                        <Copy className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">{lang === 'ar' ? 'نسخ' : 'Copy'}</span>
                                    </button>
                                    <button
                                        onClick={() => setAiSummary(null)}
                                        className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-300"
                                    >
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div
                                    className="bg-white/40 backdrop-blur-sm rounded-[32px] p-6 md:p-8 border border-white/60 shadow-inner"
                                    dir={aiOutputLang === 'ar' ? 'rtl' : 'ltr'}
                                >
                                    <MarkdownText content={aiSummary} language={aiOutputLang} />
                                </div>

                                <div className="mt-8 pt-6 border-t border-blue-100 flex items-center justify-between">
                                    <p className="text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold text-[#103090]/40 flex items-center gap-2">
                                        <Zap className="w-3 h-3" />
                                        Gen AI Comparison Engine v2.0
                                    </p>
                                    <div className="flex gap-2">
                                        <div className="w-2 h-2 rounded-full bg-[#103090]/20" />
                                        <div className="w-2 h-2 rounded-full bg-[#B8071C]/20" />
                                        <div className="w-2 h-2 rounded-full bg-[#DEB735]/20" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Comparison Table Container */}
            <div className="container mx-auto px-4 max-w-7xl -mt-16 md:-mt-20">
                <div className="bg-white rounded-[32px] shadow-[0_32px_64px_-16px_rgba(16,48,144,0.1)] border border-gray-100 relative">
                    <div
                        ref={scrollContainerRef}
                        className="overflow-x-auto custom-scrollbar"
                        style={{ overflowY: 'visible' }}
                    >
                        <div className="min-w-[1000px] pb-8">
                            {/* 2. Flow Header Row (Stays in the table) */}
                            <div ref={flowHeaderRef} className="bg-white border-b border-gray-100 py-4">
                                <div className="grid grid-cols-[180px_repeat(4,280px)] md:grid-cols-[260px_repeat(4,1fr)]">
                                    <HeaderContent vehicles={vehicles} t={t} isFixed={false} removeFromCompare={removeFromCompare} />
                                </div>
                            </div>


                            {/* Data Rows */}
                            <div className="divide-y divide-gray-50">
                                {/* 2. Investment Row */}
                                <div className={cn(
                                    "grid grid-cols-[180px_repeat(4,280px)] md:grid-cols-[260px_repeat(4,1fr)] hover:bg-gray-50/30 transition-colors group",
                                    showOnlyDifferences && !isDifferent('price') && "hidden"
                                )}>
                                    <div className="p-4 md:p-8 sticky left-0 z-20 bg-white group-hover:bg-gray-50/10 border-r border-gray-50 flex items-center gap-2 md:gap-4 shadow-[10px_0_15px_-10px_rgba(0,0,0,0.05)]">
                                        <div className="p-2 md:p-3 bg-red-50 rounded-2xl text-[#B8071C] shrink-0 shadow-sm border border-red-100/50">
                                            <Zap className="w-5 h-5 md:w-6 md:h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black text-[#B8071C]/40 leading-none mb-1.5">{t("compare.cat.financial")}</h4>
                                            <p className="italic font-serif font-bold text-[#103090] text-sm md:text-xl tracking-tight">{t("compare.val.market_value")}</p>
                                        </div>
                                    </div>
                                    {Array.from({ length: 4 }).map((_, i) => {
                                        const v = vehicles[i];
                                        const isBest = v && highlights.price?.includes(v.id);
                                        return (
                                            <div key={i} className={cn("p-8 flex flex-col items-center justify-center text-center transition-all", isBest && "bg-[#B8071C]/5")}>
                                                {v ? (
                                                    <div className="relative group/val">
                                                        <p className={cn("text-2xl md:text-4xl italic font-serif font-bold tracking-tight transition-all", isBest ? "text-[#B8071C] scale-110" : "text-[#103090] opacity-80")}>
                                                            {formatPrice(v.price)} <span className="text-xs font-serif opacity-40">{t("common.mad")}</span>
                                                        </p>
                                                        {isBest && (
                                                            <div className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-[#B8071C] to-[#800514] text-white text-[10px] font-black rounded-full shadow-lg shadow-red-200 animate-in zoom-in-50 duration-500 uppercase tracking-widest border border-white/20">
                                                                <Trophy className="w-3 h-3 text-[#DEB735]" /> <span className="italic font-serif">{t("compare.optimum")}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : <span className="text-gray-200">—</span>}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* 3. Chronology Row */}
                                <div className={cn(
                                    "grid grid-cols-[180px_repeat(4,280px)] md:grid-cols-[260px_repeat(4,1fr)] hover:bg-gray-50/30 transition-colors group",
                                    showOnlyDifferences && !isDifferent('year') && "hidden"
                                )}>
                                    <div className="p-4 md:p-8 sticky left-0 z-20 bg-white group-hover:bg-gray-50/10 border-r border-gray-50 flex items-center gap-2 md:gap-4 shadow-[10px_0_15px_-10px_rgba(0,0,0,0.05)]">
                                        <div className="p-2 md:p-3 bg-blue-50 rounded-2xl text-[#103090] shrink-0 shadow-sm border border-blue-100/50">
                                            <Settings2 className="w-5 h-5 md:w-6 md:h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black text-[#103090]/30 leading-none mb-1.5">{t("compare.cat.timepiece")}</h4>
                                            <p className="italic font-serif font-bold text-[#103090] text-sm md:text-xl tracking-tight">{t("compare.val.model_year")}</p>
                                        </div>
                                    </div>
                                    {Array.from({ length: 4 }).map((_, i) => {
                                        const v = vehicles[i];
                                        const isBest = v && highlights.year?.includes(v.id);
                                        return (
                                            <div key={i} className={cn("p-8 flex items-center justify-center text-center", isBest && "bg-blue-50/30")}>
                                                {v ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-2xl italic font-serif font-bold text-[#103090]">{v.year}</span>
                                                        {isBest && <span className="text-[10px] italic font-serif font-bold text-[#B8071C] uppercase tracking-widest mt-1">{t("compare.badge.evolved")}</span>}
                                                    </div>
                                                ) : <span className="text-gray-200">—</span>}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* 4. Journey Row */}
                                <div className={cn(
                                    "grid grid-cols-[180px_repeat(4,280px)] md:grid-cols-[260px_repeat(4,1fr)] hover:bg-gray-50/30 transition-colors group",
                                    showOnlyDifferences && !isDifferent('mileage') && "hidden"
                                )}>
                                    <div className="p-4 md:p-8 sticky left-0 z-20 bg-white group-hover:bg-gray-50/10 border-r border-gray-50 flex items-center gap-2 md:gap-4 shadow-[10px_0_15px_-10px_rgba(0,0,0,0.05)]">
                                        <div className="p-2 md:p-3 bg-blue-50 rounded-2xl text-[#103090] shrink-0 shadow-sm border border-blue-100/50">
                                            <Gauge className="w-5 h-5 md:w-6 md:h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black text-[#103090]/30 leading-none mb-1.5">{t("compare.cat.legacy")}</h4>
                                            <p className="italic font-serif font-bold text-[#103090] text-sm md:text-xl tracking-tight">{t("compare.val.distance")}</p>
                                        </div>
                                    </div>
                                    {Array.from({ length: 4 }).map((_, i) => {
                                        const v = vehicles[i];
                                        const isBest = v && v.mileage && highlights.mileage?.includes(v.id);
                                        return (
                                            <div key={i} className={cn("p-8 flex items-center justify-center text-center font-medium text-lg text-[#103090]", isBest && "bg-[#B8071C]/5")}>
                                                {v ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className={cn("text-2xl italic font-serif font-bold transition-all", isBest ? "text-[#B8071C] scale-110" : "text-[#103090] opacity-80")}>
                                                            {v.mileage ? v.mileage.toLocaleString() + " " + t("common.km") : t("compare.pristine")}
                                                        </span>
                                                        {isBest && (
                                                            <div className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-[#B8071C] to-[#800514] text-white text-[10px] font-black rounded-full shadow-lg shadow-red-200 animate-in zoom-in-50 duration-500 uppercase tracking-widest border border-white/20">
                                                                <Trophy className="w-3 h-3 text-[#DEB735]" /> <span className="italic font-serif">{t("compare.prime_condition")}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : <span className="text-gray-200">—</span>}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* 5. Power Transmission Row */}
                                <div className={cn(
                                    "grid grid-cols-[180px_repeat(4,280px)] md:grid-cols-[260px_repeat(4,1fr)] hover:bg-gray-50/30 transition-colors group",
                                    showOnlyDifferences && !isDifferent('transmission') && "hidden"
                                )}>
                                    <div className="p-4 md:p-8 sticky left-0 z-20 bg-white group-hover:bg-gray-50/10 border-r border-gray-50 flex items-center gap-2 md:gap-4 shadow-[10px_0_15px_-10px_rgba(0,0,0,0.05)]">
                                        <div className="p-2 md:p-3 bg-blue-50 rounded-2xl text-[#103090] shrink-0 shadow-sm border border-blue-100/50">
                                            <Settings2 className="w-5 h-5 md:w-6 md:h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black text-[#103090]/30 leading-none mb-1.5">{t("compare.cat.dynamics")}</h4>
                                            <p className="italic font-serif font-bold text-[#103090] text-sm md:text-xl tracking-tight">{t("filter.transmission")}</p>
                                        </div>
                                    </div>
                                    {Array.from({ length: 4 }).map((_, i) => {
                                        const v = vehicles[i];
                                        return (
                                            <div key={i} className="p-8 flex items-center justify-center text-center font-medium text-[#103090]/70">
                                                {v ? (
                                                    <div className="px-4 py-2 border border-gray-100 rounded-lg bg-white shadow-sm italic font-serif font-bold uppercase tracking-widest text-xs">
                                                        {t(`vehicle.transmission.${(v.transmission || "manual").toLowerCase()}` as any) || v.transmission}
                                                    </div>
                                                ) : <span className="text-gray-200">—</span>}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* 6. Propulsion Row */}
                                <div className={cn(
                                    "grid grid-cols-[180px_repeat(4,280px)] md:grid-cols-[260px_repeat(4,1fr)] hover:bg-gray-50/30 transition-colors group",
                                    showOnlyDifferences && !isDifferent('fuel_type') && "hidden"
                                )}>
                                    <div className="p-4 md:p-8 sticky left-0 z-20 bg-white group-hover:bg-gray-50/10 border-r border-gray-50 flex items-center gap-2 md:gap-4 shadow-[10px_0_15px_-10px_rgba(0,0,0,0.05)]">
                                        <div className="p-2 md:p-3 bg-blue-50 rounded-2xl text-[#103090] shrink-0 shadow-sm border border-blue-100/50">
                                            <Fuel className="w-5 h-5 md:w-6 md:h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black text-[#103090]/30 leading-none mb-1.5">{t("compare.cat.energy")}</h4>
                                            <p className="italic font-serif font-bold text-[#103090] text-sm md:text-xl tracking-tight">{t("compare.val.fuel_source")}</p>
                                        </div>
                                    </div>
                                    {Array.from({ length: 4 }).map((_, i) => {
                                        const v = vehicles[i];
                                        return (
                                            <div key={i} className="p-8 flex items-center justify-center text-center font-medium text-[#103090]/70">
                                                {v ? (
                                                    <div className="inline-flex items-center gap-1.5 italic font-serif font-bold text-[#103090]">
                                                        {v.fuel_type?.toLowerCase().includes('electric') ? <Zap className="w-4 h-4 text-[#DEB735]" /> : <Fuel className="w-4 h-4 opacity-30" />}
                                                        {t(`vehicle.fuel.${(v.fuel_type || "diesel").toLowerCase()}` as any) || v.fuel_type}
                                                    </div>
                                                ) : <span className="text-gray-200">—</span>}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* 7. Location Row */}
                                <div className={cn(
                                    "grid grid-cols-[180px_repeat(4,280px)] md:grid-cols-[260px_repeat(4,1fr)] hover:bg-gray-50/30 transition-colors group",
                                    showOnlyDifferences && !isDifferent('location') && "hidden"
                                )}>
                                    <div className="p-4 md:p-8 sticky left-0 z-20 bg-white group-hover:bg-gray-50/10 border-r border-gray-50 flex items-center gap-2 md:gap-4 shadow-[10px_0_15px_-10px_rgba(0,0,0,0.05)]">
                                        <div className="p-2 md:p-3 bg-blue-50 rounded-2xl text-[#103090] shrink-0 shadow-sm border border-blue-100/50">
                                            <MapPin className="w-5 h-5 md:w-6 md:h-6" />
                                        </div>
                                        <div>
                                            <h4 className="text-[9px] md:text-[10px] uppercase tracking-[0.2em] font-black text-[#103090]/30 leading-none mb-1.5">{t("compare.cat.residence")}</h4>
                                            <p className="italic font-serif font-bold text-[#103090] text-sm md:text-xl tracking-tight">{t("compare.val.availability")}</p>
                                        </div>
                                    </div>
                                    {Array.from({ length: 4 }).map((_, i) => {
                                        const v = vehicles[i];
                                        return (
                                            <div key={i} className="p-8 flex items-center justify-center text-center">
                                                {v ? (
                                                    <div className="italic font-serif text-[#103090]/60">
                                                        {v.location ? (t(`location.city.${v.location.toLowerCase().replace(/\s+/g, '')}` as any) || v.location) : "—"}
                                                    </div>
                                                ) : <span className="text-gray-200">—</span>}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Action Bar Row */}
                                <div className={cn(
                                    "grid grid-cols-[180px_repeat(4,280px)] md:grid-cols-[260px_repeat(4,1fr)] bg-gray-50/30",
                                    showOnlyDifferences && "hidden"
                                )}>
                                    <div className="p-4 md:p-10 border-r border-gray-100 flex items-center justify-center italic text-[10px] md:text-sm text-[#103090]/30 font-serif sticky left-0 z-20 bg-gray-50/50 backdrop-blur-md">
                                        {t("compare.final_engagement")}
                                    </div>
                                    {Array.from({ length: 4 }).map((_, i) => {
                                        const v = vehicles[i];
                                        return (
                                            <div key={i} className="p-10 flex items-center justify-center">
                                                {v && (
                                                    <Link
                                                        href={v.url}
                                                        className="px-8 py-3 bg-[#103090] text-white rounded-full text-xs italic font-serif font-black uppercase tracking-[0.2em] hover:bg-[#B8071C] transition-all shadow-xl hover:-translate-y-1 active:translate-y-0"
                                                    >
                                                        {t("common.view_details")}
                                                    </Link>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* AI Language Selection Modal */}
            {
                isLanguageModalOpen && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
                        <div
                            className="bg-white rounded-[32px] w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-300"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-2xl font-black font-serif text-[#103090]">
                                        {t("nav.language")}
                                    </h3>
                                    <button
                                        onClick={() => setIsLanguageModalOpen(false)}
                                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <X className="w-6 h-6 text-gray-400" />
                                    </button>
                                </div>

                                <p className="text-gray-500 mb-8 font-serif italic text-lg">
                                    {lang === 'ar' ? 'اختر لغة تحليل الذكاء الاصطناعي:' : 'Choose AI analysis language:'}
                                </p>

                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { code: 'ar', label: 'العربية', icon: '🇲🇦' },
                                        { code: 'fr', label: 'Français', icon: '🇫🇷' },
                                        { code: 'en', label: 'English', icon: '🇬🇧' },
                                        { code: 'es', label: 'Español', icon: '🇪🇸' }
                                    ].map((l) => (
                                        <button
                                            key={l.code}
                                            onClick={() => handleAIAnalysis(l.code)}
                                            className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 hover:border-[#103090] hover:bg-[#103090]/5 transition-all text-left font-bold text-[#103090]"
                                        >
                                            <span className="text-2xl">{l.icon}</span>
                                            <span>{l.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-gray-50 p-6 flex justify-center">
                                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-gray-300">karkey AI Engine</p>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
