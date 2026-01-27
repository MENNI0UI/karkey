"use client";

import React from "react";

export function CarCardSkeleton() {
    return (
        <div className="relative bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full animate-pulse">
            {/* Photo Section Skeleton */}
            <div className="min-h-[22rem] md:min-h-[26rem] bg-gray-100 relative">
                <div className="absolute top-3 left-3 w-16 h-6 bg-gray-200 rounded-full" />
                <div className="absolute top-3 right-3 w-8 h-8 bg-gray-200 rounded-full" />
            </div>

            {/* Content Section Skeleton */}
            <div className="p-4 flex flex-col flex-1">
                {/* ID & Year */}
                <div className="mb-2 flex items-center gap-2">
                    <div className="w-16 h-6 bg-gray-200 rounded-full" />
                    <div className="w-10 h-5 bg-gray-100 rounded" />
                </div>

                {/* Title */}
                <div className="h-7 bg-gray-200 rounded-md w-3/4 mb-1" />

                {/* Location */}
                <div className="mb-3 flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-200 rounded-full" />
                    <div className="h-4 bg-gray-100 rounded-md w-1/3" />
                </div>

                {/* Price */}
                <div className="mb-4">
                    <div className="h-8 bg-gray-200 rounded-md w-1/2" />
                </div>

                <div className="border-t border-gray-50 mb-4" />

                {/* Specs Grid Skeleton */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    {[1, 2, 3, 4, 5, 6].map((it) => (
                        <div key={it} className="flex items-center gap-2.5">
                            <div className="w-4 h-4 bg-gray-100 rounded-full" />
                            <div className="h-4 bg-gray-100 rounded-md w-12" />
                        </div>
                    ))}
                </div>

                {/* Actions Skeleton */}
                <div className="mt-4 space-y-2">
                    <div className="w-full h-10 bg-gray-200 rounded-2xl" />
                    <div className="w-full h-10 bg-gray-100 rounded-2xl" />
                </div>
            </div>
        </div>
    );
}

export function CarGridSkeleton({ count = 4 }: { count?: number }) {
    // Generate an array of IDs based on count
    const skeletonIds = Array.from({ length: Math.max(1, count) }, (_, i) => `car-skel-${i}`);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {skeletonIds.map((id) => (
                <CarCardSkeleton key={id} />
            ))}
        </div>
    );
}
