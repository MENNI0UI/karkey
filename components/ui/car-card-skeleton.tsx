"use client";

import React from "react";

export function CarCardSkeleton() {
    return (
        <div className="bg-white rounded-3xl shadow-md overflow-hidden border border-gray-100 animate-pulse">
            {/* Photo Section Skeleton */}
            <div className="aspect-[4/3] bg-gray-200 relative">
                <div className="absolute top-4 left-4 w-16 h-6 bg-gray-300 rounded-full" />
            </div>

            {/* Content Section Skeleton */}
            <div className="p-4 flex flex-col gap-3">
                {/* Title & Year */}
                <div className="flex justify-between items-center">
                    <div className="h-6 bg-gray-200 rounded-md w-3/4" />
                </div>

                <div className="h-4 bg-gray-200 rounded-md w-1/4" />

                {/* Location */}
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-gray-200 rounded-full" />
                    <div className="h-4 bg-gray-200 rounded-md w-1/2" />
                </div>

                {/* Price */}
                <div className="h-8 bg-gray-200 rounded-md w-1/3 my-2" />

                {/* Divider */}
                <div className="border-t border-gray-100 my-1" />

                {/* Specs Grid Skeleton */}
                <div className="grid grid-cols-2 gap-4">
                    {["s1", "s2", "s3", "s4"].map((id) => (
                        <div key={id} className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-gray-200 rounded-sm" />
                            <div className="h-3 bg-gray-200 rounded-md w-12" />
                        </div>
                    ))}
                </div>

                {/* Actions Skeleton */}
                <div className="flex gap-2 mt-4">
                    <div className="flex-1 h-10 bg-gray-200 rounded-2xl" />
                    <div className="w-12 h-10 bg-gray-200 rounded-2xl" />
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
