"use client"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface CarCardSkeletonProps {
    className?: string
    viewMode?: "grid" | "list"
}

export function CarCardSkeleton({ className, viewMode = "grid" }: CarCardSkeletonProps) {
    if (viewMode === "list") {
        return (
            <div className={cn("grid grid-cols-1 sm:grid-cols-[280px_1fr] rounded-xl border border-gray-100 bg-white overflow-hidden shadow-sm h-auto sm:h-[200px]", className)}>
                {/* Image Area */}
                <Skeleton className="h-[200px] w-full sm:w-[280px]" />

                {/* Content Area */}
                <div className="p-4 flex flex-col justify-between h-full">
                    <div>
                        <div className="flex items-start justify-between mb-3">
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-[40%] rounded-full" />
                                <Skeleton className="h-6 w-[70%] rounded-md" />
                            </div>
                            <Skeleton className="h-6 w-16 rounded" />
                        </div>

                        <Skeleton className="h-6 w-32 rounded mb-4" />

                        <div className="flex flex-wrap gap-4 mb-3">
                            <Skeleton className="h-4 w-20 rounded-full" />
                            <Skeleton className="h-4 w-24 rounded-full" />
                            <Skeleton className="h-4 w-20 rounded-full" />
                            <Skeleton className="h-4 w-22 rounded-full" />
                        </div>

                        <Skeleton className="h-4 w-[60%] rounded-full" />
                    </div>

                    <div className="mt-3">
                        <Skeleton className="h-9 w-32 rounded-md" />
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className={cn("bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full", className)}>
            {/* Image Area */}
            <Skeleton className="aspect-[4/3] w-full" />

            {/* Info Section */}
            <div className="p-4 flex-1 flex flex-col">
                {/* Top Badges */}
                <div className="flex gap-2 mb-3">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                </div>

                {/* Title */}
                <Skeleton className="h-7 w-[80%] rounded-md mb-2" />

                {/* Location */}
                <div className="flex items-center gap-2 mb-4">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-4 w-[50%] rounded-full" />
                </div>

                {/* Price/Context */}
                <Skeleton className="h-8 w-[60%] rounded-md mb-4" />

                {/* Divider */}
                <div className="border-t border-gray-100 my-4" />

                {/* Specs Grid */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 mb-4">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-16 rounded-full" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-16 rounded-full" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-16 rounded-full" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4 rounded-full" />
                        <Skeleton className="h-4 w-16 rounded-full" />
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-50 bg-gray-50/30">
                <Skeleton className="h-10 w-full rounded-xl" />
            </div>
        </div>
    )
}
