"use client";

import React from "react";

export function CarCardSkeleton() {
    return (
        <div className="relative bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden luxury-shimmer">
            {/* Photo Section Skeleton */}
            <div className="min-h-[22rem] md:min-h-[26rem] bg-slate-100/30 relative">
                <div className="absolute top-3 left-3 w-16 h-6 bg-white/40 rounded-full blur-[1px]" />
                <div className="absolute top-3 right-3 w-8 h-8 bg-white/40 rounded-full blur-[1px]" />
            </div>

            {/* Content Section Skeleton */}
            <div className="p-4 flex flex-col flex-1 gap-3">
                {/* ID & Year */}
                <div className="flex items-center gap-2">
                    <div className="w-16 h-6 bg-slate-100 rounded-full" />
                    <div className="w-10 h-5 bg-slate-50 rounded" />
                </div>

                {/* Title */}
                <div className="h-7 bg-slate-100 rounded-md w-3/4" />

                {/* Location */}
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-slate-100 rounded-full" />
                    <div className="h-4 bg-slate-50 rounded-md w-1/3" />
                </div>

                {/* Price */}
                <div className="mt-2">
                    <div className="h-8 bg-slate-100 rounded-md w-1/2" />
                </div>

                <div className="border-t border-slate-50 my-2" />

                {/* Specs Grid Skeleton */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    {[1, 2, 3, 4, 5, 6].map((it) => (
                        <div key={it} className="flex items-center gap-2.5">
                            <div className="w-4 h-4 bg-slate-100 rounded-full" />
                            <div className="h-4 bg-slate-50 rounded-md w-12" />
                        </div>
                    ))}
                </div>

                {/* Actions Skeleton */}
                <div className="mt-auto pt-4 space-y-2">
                    <div className="w-full h-11 bg-slate-100 rounded-2xl" />
                </div>
            </div>
        </div>
    );
}

export function CarListSkeleton() {
    return (
        <div className="relative bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row h-full overflow-hidden luxury-shimmer">
            {/* Photo Section Skeleton */}
            <div className="md:w-80 lg:w-96 w-full h-64 md:h-auto bg-slate-100/30 relative">
                <div className="absolute top-4 left-4 w-20 h-7 bg-white/40 rounded-full blur-[1px]" />
            </div>

            {/* Content Section Skeleton */}
            <div className="p-6 md:p-8 flex flex-col flex-1 gap-4">
                <div className="flex justify-between items-start">
                    <div className="space-y-3 w-full">
                        <div className="flex items-center gap-2">
                            <div className="w-16 h-6 bg-slate-100 rounded-full" />
                            <div className="w-24 h-5 bg-slate-50 rounded hidden md:block" />
                        </div>
                        <div className="h-10 bg-slate-100 rounded-md w-3/4" />
                        <div className="h-8 bg-slate-100 rounded-md w-1/3" />
                    </div>
                </div>

                <div className="border-t border-slate-50 my-2" />

                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((it) => (
                        <div key={it} className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-slate-100 rounded-full" />
                            <div className="h-4 bg-slate-50 rounded-md w-16" />
                        </div>
                    ))}
                </div>

                <div className="mt-auto pt-6 flex flex-col md:flex-row items-center gap-4">
                    <div className="flex-1 w-full bg-slate-50 h-14 rounded-2xl" />
                    <div className="w-full md:w-48 h-14 bg-slate-100 rounded-2xl" />
                </div>
            </div>
        </div>
    );
}

export function CarGridSkeleton({ count = 4, viewMode = 'grid' }: { count?: number, viewMode?: 'grid' | 'list' }) {
    const isList = viewMode === 'list';
    const skeletonIds = Array.from({ length: Math.max(1, count) }, (_, i) => `car-skel-${i}`);

    return (
        <div className={isList ? "flex flex-col gap-6" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 tv:grid-cols-6 4xl:grid-cols-8 gap-3 lg:gap-4"}>
            {skeletonIds.map((id) => (
                isList ? <CarListSkeleton key={id} /> : <CarCardSkeleton key={id} />
            ))}
        </div>
    );
}
