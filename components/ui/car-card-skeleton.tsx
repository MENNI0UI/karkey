"use client";

import React from "react";

export function CarCardSkeleton({ type = 'sale' }: { type?: 'auction' | 'sale' | 'karkey' }) {
    return (
        <div className="relative bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden animate-pulse">
            {/* Photo Section Skeleton */}
            <div className="relative aspect-[4/5] md:aspect-square bg-gray-50">
                {type === 'karkey' ? (
                    <div className="absolute top-3 left-3 w-14 h-6 bg-[#103090]/20 rounded-full" />
                ) : (
                    <div className="absolute top-3 left-3 w-16 h-6 bg-gray-200/50 rounded-full" />
                )}
                <div className="absolute top-3 right-3 w-10 h-10 bg-white/40 rounded-full backdrop-blur-sm" />
            </div>

            {/* Content Section Skeleton */}
            <div className="p-4 flex flex-col flex-1">
                {/* Year Badge Mirror */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-5 bg-red-100/50 rounded" />
                </div>

                {/* Title */}
                <div className="h-7 bg-gray-100 rounded-md w-3/4 mb-2" />

                {/* Location */}
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-5 h-5 bg-red-50 rounded-full" />
                    <div className="h-4 bg-gray-50 rounded-md w-1/3" />
                </div>

                {/* Price */}
                <div className="mt-auto mb-4">
                    <div className="h-8 bg-gray-100 rounded-md w-2/3" />
                </div>

                <div className="border-t border-gray-50 my-4" />

                {/* Specs Grid Skeleton */}
                <div className="grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4, 5, 6].map((it) => (
                        <div key={it} className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-gray-100 rounded" />
                            <div className="h-4 bg-gray-50 rounded-md w-12" />
                        </div>
                    ))}
                </div>

                {/* Actions Skeleton */}
                <div className="mt-6 flex flex-col gap-2">
                    {type === 'auction' ? (
                        <>
                            <div className="border-t border-gray-50 pt-4 pb-1">
                                <div className="h-3 w-16 bg-gray-100 mb-2" />
                                <div className="h-10 w-full bg-gray-100 rounded-xl" />
                            </div>
                            <div className="w-full h-10 bg-red-100/50 rounded-2xl" />
                        </>
                    ) : type === 'karkey' ? (
                        <div className="flex gap-2">
                            <div className="flex-1 h-10 bg-red-100/50 rounded-2xl" />
                            <div className="w-12 h-10 bg-red-100/50 rounded-2xl" />
                        </div>
                    ) : (
                        <>
                            <div className="w-full h-10 bg-red-100/50 rounded-2xl" />
                            <div className="w-full h-10 bg-red-100/50 rounded-2xl" />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export function CarListSkeleton({ type = 'sale' }: { type?: 'auction' | 'sale' }) {
    return (
        <div className="relative bg-white rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row h-full overflow-hidden animate-pulse">
            {/* Photo Section Skeleton */}
            <div className="md:w-80 lg:w-96 w-full h-64 md:h-auto bg-gray-50 relative">
                <div className="absolute top-4 left-4 w-20 h-7 bg-white/40 rounded-full" />
            </div>

            {/* Content Section Skeleton */}
            <div className="p-4 md:p-8 flex flex-col flex-1">
                <div className="flex flex-col flex-1">
                    {/* Header Row */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-5 bg-red-100/50 rounded" />
                        <div className="flex items-center gap-2">
                            <div className="w-5 h-5 bg-red-100/50 rounded-full" />
                            <div className="h-5 w-24 bg-gray-100 rounded" />
                        </div>
                    </div>

                    {/* Title & Price Row */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 border-b border-gray-50 pb-6">
                        <div className="h-10 bg-gray-100 rounded-md w-3/4" />
                        <div className="h-10 bg-gray-50 rounded-md w-32" />
                    </div>

                    {/* Specs */}
                    <div className="flex-1">
                        <div className="h-4 w-32 bg-gray-100 mb-4" />
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3, 4, 5, 6].map((it) => (
                                <div key={it} className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-gray-100 rounded" />
                                    <div className="h-4 bg-gray-50 rounded-md w-16" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex flex-row items-center gap-4">
                        {type === 'auction' ? (
                            <>
                                <div className="flex-1 border-s-4 border-red-100 ps-4 py-1">
                                    <div className="h-3 w-16 bg-gray-100 mb-2" />
                                    <div className="h-10 w-full bg-gray-100 rounded-xl" />
                                </div>
                                <div className="px-12 h-[52px] w-48 bg-red-100/50 rounded-2xl" />
                            </>
                        ) : (
                            <>
                                <div className="flex-1 h-[52px] bg-red-100/50 rounded-2xl" />
                                <div className="flex-1 h-[52px] bg-red-100/50 rounded-2xl" />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function CarGridSkeleton({ count = 12, viewMode = 'grid', type = 'sale' }: { count?: number, viewMode?: 'grid' | 'list', type?: 'auction' | 'sale' | 'karkey' }) {
    const isList = viewMode === 'list';
    const skeletonIds = Array.from({ length: Math.max(1, count) }, (_, i) => `car-skel-${i}`);

    return (
        <div className={isList ? "flex flex-col gap-6" : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 3xl:grid-cols-5 tv:grid-cols-6 4xl:grid-cols-8 gap-3 lg:gap-4"}>
            {skeletonIds.map((id) => (
                isList ? <CarListSkeleton key={id} type={type as any} /> : <CarCardSkeleton key={id} type={type} />
            ))}
        </div>
    );
}
