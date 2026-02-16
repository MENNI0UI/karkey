"use client";

import React from "react";
import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

export function CompareTableSkeleton() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header Skeleton */}
            <div className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-[100]">
                <div className="grid grid-cols-[140px_repeat(4,1fr)] md:grid-cols-[200px_repeat(4,1fr)]">
                    {/* Corner */}
                    <div className="p-8 border-r border-gray-50 flex flex-col items-center justify-center gap-2">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <Skeleton className="w-16 h-2 rounded-full" />
                    </div>

                    {/* Vehicle Card Skeletons */}
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="p-6 border-r border-gray-50 last:border-r-0">
                            <div className="flex flex-col gap-4">
                                <Skeleton className="aspect-[16/10] rounded-2xl w-full" />
                                <div className="space-y-2">
                                    <Skeleton className="h-5 w-3/4 mx-auto" />
                                    <Skeleton className="h-3 w-1/2 mx-auto" />
                                </div>
                                <Skeleton className="h-10 w-full rounded-xl mt-2" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Skeletons (Specs Table) */}
            <div className="max-w-[1440px] mx-auto">
                {[1, 2, 3].map((cat) => (
                    <div key={cat} className="mt-12">
                        {/* Category Header */}
                        <div className="px-8 mb-6">
                            <div className="flex items-center gap-3">
                                <Skeleton className="w-8 h-8 rounded-lg" />
                                <Skeleton className="h-6 w-32 rounded-full" />
                            </div>
                        </div>

                        {/* Rows */}
                        {[1, 2, 3, 4].map((row) => (
                            <div
                                key={row}
                                className="grid grid-cols-[140px_repeat(4,1fr)] md:grid-cols-[200px_repeat(4,1fr)] border-b border-gray-50 last:border-b-0"
                            >
                                {/* Label Column */}
                                <div className="p-6 bg-gray-50/30 border-r border-gray-50">
                                    <Skeleton className="h-4 w-20" />
                                </div>

                                {/* Value Columns */}
                                {[1, 2, 3, 4].map((col) => (
                                    <div key={col} className="p-6 border-r border-gray-50 last:border-r-0 flex items-center justify-center">
                                        <Skeleton className="h-5 w-24" />
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                ))}
            </div>

            {/* AI Summary Skeleton */}
            <div className="mt-12 p-8 max-w-4xl mx-auto">
                <div className="bg-blue-50/50 rounded-3xl p-8 border border-blue-100 space-y-4">
                    <div className="flex items-center gap-3 mb-6">
                        <Skeleton className="w-10 h-10 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-48" />
                        </div>
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <div className="pt-6">
                        <Skeleton className="h-12 w-full rounded-2xl" />
                    </div>
                </div>
            </div>
        </div>
    );
}
