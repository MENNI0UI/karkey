"use client";

import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Eye, Heart, MessageCircle, Store, CheckCircle, Clock, ShoppingBag, TrendingUp } from "lucide-react";
import { m } from "framer-motion";
import { useTranslation } from "@/lib/i18n-context";
import { getUserStatistics } from "./actions";
import { LuxuryLoader } from "@/components/ui/luxury-loader";
import { ListingPerformance, UserStatistics } from "./types";

interface StatisticsSectionProps {
    userId: number;
}

export default function StatisticsSection({ userId }: StatisticsSectionProps) {
    const { t } = useTranslation();
    const [stats, setStats] = useState<UserStatistics | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            const result = await getUserStatistics(userId);
            if (result.success) {
                setStats(result.statistics);
            }
            setLoading(false);
        };
        fetchStats();
    }, [userId]);

    const statCards = [
        {
            icon: Eye,
            value: stats?.totalViews || 0,
            label: t("profile.statistics.views"),
            color: "from-blue-500 to-blue-600",
            bgColor: "bg-blue-50",
            iconColor: "text-blue-500",
        },
        {
            icon: Heart,
            value: stats?.totalSaves || 0,
            label: t("profile.statistics.saves"),
            color: "from-pink-500 to-rose-500",
            bgColor: "bg-pink-50",
            iconColor: "text-pink-500",
        },
        {
            icon: MessageCircle,
            value: stats?.totalContacts || 0,
            label: t("profile.statistics.contacts"),
            color: "from-green-500 to-emerald-500",
            bgColor: "bg-green-50",
            iconColor: "text-green-500",
        },
        {
            icon: Store,
            value: stats?.activeListings || 0,
            label: t("profile.statistics.active_listings"),
            color: "from-violet-500 to-purple-500",
            bgColor: "bg-violet-50",
            iconColor: "text-violet-500",
        },
        {
            icon: ShoppingBag,
            value: stats?.soldListings || 0,
            label: t("profile.statistics.sold_listings"),
            color: "from-amber-500 to-orange-500",
            bgColor: "bg-amber-50",
            iconColor: "text-amber-500",
        },
        {
            icon: CheckCircle,
            value: stats?.approvedListings || 0,
            label: t("profile.statistics.approved_listings"),
            color: "from-teal-500 to-cyan-500",
            bgColor: "bg-teal-50",
            iconColor: "text-teal-500",
        },
        {
            icon: Clock,
            value: stats?.pendingListings || 0,
            label: t("profile.statistics.pending_listings"),
            color: "from-slate-500 to-gray-500",
            bgColor: "bg-slate-50",
            iconColor: "text-slate-500",
        },
        {
            icon: TrendingUp,
            value: stats?.totalListings || 0,
            label: t("profile.statistics.total_listings"),
            color: "from-indigo-500 to-blue-500",
            bgColor: "bg-indigo-50",
            iconColor: "text-indigo-500",
        },
    ];

    if (loading) {
        return (
            <div className="w-full flex items-center justify-center py-20">
                <LuxuryLoader size="lg" />
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Premium Header */}
            <div className="text-center mb-10">
                <h1 className="text-4xl md:text-5xl font-serif text-[#008E46] mb-2 relative inline-block">
                    {t("profile.statistics.title")}
                    <m.span
                        initial={{ width: 0 }}
                        animate={{ width: "100%" }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="absolute -bottom-2 left-0 h-[2px] bg-gradient-to-r from-transparent via-[#008E46] to-transparent"
                    />
                </h1>
                <p className="text-gray-500 font-serif max-w-lg mx-auto">
                    {t("profile.statistics.subtitle")}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-12">
                {statCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={index}
                            className="group relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-transparent transition-all duration-300 overflow-hidden"
                        >
                            {/* Gradient Overlay on Hover */}
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />

                            {/* Icon Container */}
                            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${card.bgColor} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                <Icon className={`w-6 h-6 ${card.iconColor}`} />
                            </div>

                            {/* Value */}
                            <div className="relative">
                                <span className="text-3xl md:text-4xl font-bold text-gray-900 font-serif">
                                    {card.value.toLocaleString()}
                                </span>
                            </div>

                            {/* Label */}
                            <p className="text-sm text-gray-500 mt-1 font-medium">
                                {card.label}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Detailed Listing Performance */}
            {stats?.listingPerformance && stats.listingPerformance.length > 0 && (
                <div className="space-y-6 mb-12">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-serif text-[#008E46] font-bold">
                            Listing Performance
                        </h2>
                    </div>

                    {/* Desktop View: Horizontal Cards */}
                    <div className="hidden lg:block space-y-4">
                        {stats.listingPerformance.map((item) => (
                            <article
                                key={item.id}
                                className="group flex gap-6 items-stretch rounded-3xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] transition-all duration-300 overflow-hidden font-serif border border-gray-100 hover:border-[#008E46]/20"
                            >
                                {/* Image */}
                                <div className="w-48 relative flex-shrink-0 bg-gray-100 overflow-hidden">
                                    {item.image_url ? (
                                        <Image
                                            src={item.image_url}
                                            alt={item.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <Store className="w-8 h-8" />
                                        </div>
                                    )}
                                    <span className={`absolute top-2 left-2 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider text-white shadow-md ${item.status === 'Active' ? 'bg-emerald-500' :
                                        item.status === 'Sold' ? 'bg-amber-500' :
                                            'bg-gray-500'
                                        }`}>
                                        {item.status}
                                    </span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 py-4 pr-6 flex flex-col justify-between">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-xl text-gray-900 group-hover:text-[#008E46] transition-colors mb-1">
                                                {item.title}
                                            </h3>
                                            <p className="text-sm text-gray-500">
                                                {new Date(item.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Link href={`/direct-sales/${item.id}`} className="text-sm font-bold text-[#008E46] hover:text-[#B8071C] transition-colors opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 duration-300">
                                            {t("profile.view")} →
                                        </Link>
                                    </div>

                                    {/* Stats Row */}
                                    <div className="grid grid-cols-3 gap-4 pt-4 mt-2 border-t border-gray-100">
                                        <div className="text-center px-4 py-2 bg-blue-50/50 rounded-xl hover:bg-blue-50 transition-colors">
                                            <div className="flex items-center justify-center gap-2 text-blue-600 mb-1">
                                                <Eye className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase tracking-wider">{t("profile.statistics.views")}</span>
                                            </div>
                                            <span className="text-lg font-bold text-gray-900">{item.views.toLocaleString()}</span>
                                        </div>
                                        <div className="text-center px-4 py-2 bg-pink-50/50 rounded-xl hover:bg-pink-50 transition-colors">
                                            <div className="flex items-center justify-center gap-2 text-pink-600 mb-1">
                                                <Heart className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase tracking-wider">{t("profile.statistics.saves")}</span>
                                            </div>
                                            <span className="text-lg font-bold text-gray-900">{item.saves.toLocaleString()}</span>
                                        </div>
                                        <div className="text-center px-4 py-2 bg-green-50/50 rounded-xl hover:bg-green-50 transition-colors">
                                            <div className="flex items-center justify-center gap-2 text-green-600 mb-1">
                                                <MessageCircle className="w-4 h-4" />
                                                <span className="text-xs font-bold uppercase tracking-wider">{t("profile.statistics.contacts")}</span>
                                            </div>
                                            <span className="text-lg font-bold text-gray-900">{item.contacts.toLocaleString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>

                    {/* Mobile View: Grid Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:hidden">
                        {stats.listingPerformance.map((item) => (
                            <article
                                key={item.id}
                                className="group relative rounded-3xl bg-white shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden flex flex-col"
                            >
                                {/* Image */}
                                <div className="h-48 w-full relative bg-gray-100">
                                    {item.image_url ? (
                                        <Image
                                            src={item.image_url}
                                            alt={item.title}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="h-full flex items-center justify-center text-gray-300">
                                            <Store className="w-8 h-8" />
                                        </div>
                                    )}
                                    <span className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider text-white shadow-md ${item.status === 'Active' ? 'bg-emerald-500' :
                                        item.status === 'Sold' ? 'bg-amber-500' :
                                            'bg-gray-500'
                                        }`}>
                                        {item.status}
                                    </span>
                                </div>

                                <div className="p-5 flex flex-col flex-1">
                                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1 mb-1">
                                        {item.title}
                                    </h3>
                                    <p className="text-xs text-gray-500 mb-4">{new Date(item.created_at).toLocaleDateString()}</p>

                                    <div className="grid grid-cols-3 gap-2 mt-auto pt-4 border-t border-gray-100 text-center">
                                        <div>
                                            <div className="text-blue-500 mb-1 flex justify-center"><Eye className="w-4 h-4" /></div>
                                            <span className="block text-sm font-bold text-gray-900">{item.views}</span>
                                        </div>
                                        <div>
                                            <div className="text-pink-500 mb-1 flex justify-center"><Heart className="w-4 h-4" /></div>
                                            <span className="block text-sm font-bold text-gray-900">{item.saves}</span>
                                        </div>
                                        <div>
                                            <div className="text-green-500 mb-1 flex justify-center"><MessageCircle className="w-4 h-4" /></div>
                                            <span className="block text-sm font-bold text-gray-900">{item.contacts}</span>
                                        </div>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {stats?.totalListings === 0 && (
                <div className="mt-12 text-center py-16 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-100">
                    <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-serif text-gray-600 mb-2">
                        {t("profile.statistics.no_listings")}
                    </h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                        {t("profile.statistics.no_listings_desc")}
                    </p>
                </div>
            )}
        </div>
    );
}
