"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Star, GripVertical, Image as ImageIcon } from "lucide-react";
import { validateImageFile } from "@/lib/validations";
import { useTranslation } from "@/lib/i18n-context";

interface PhotoUploadGridProps {
    photos: (string | File)[];
    onChange: (photos: (string | File)[]) => void;
    minPhotos?: number;
    maxPhotos?: number;
    label?: string;
}

export function PhotoUploadGrid({
    photos,
    onChange,
    minPhotos = 5,
    maxPhotos = 10,
    label,
}: PhotoUploadGridProps) {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const MAX_FILE_SIZE_MB = 20;

    const handleFileSelect = useCallback(
        (files: FileList | null) => {
            if (!files) return;
            setError(null);

            const filesArray = Array.from(files);
            const validFiles: File[] = [];
            let lastError: string | null = null;

            for (const file of filesArray) {
                const validation = validateImageFile(file);
                if (validation.isValid) {
                    validFiles.push(file);
                } else {
                    lastError = validation.error || "validation.image_invalid";
                    console.warn(`[photo-upload] File rejected: ${file.name}`, validation.error);
                }
            }

            if (lastError) {
                setError(t(lastError as any) || lastError);
                // Clear error after a few seconds
                setTimeout(() => setError(null), 8000);
            }

            const remainingSlots = maxPhotos - photos.length;
            const filesToAdd = validFiles.slice(0, remainingSlots);
            if (filesToAdd.length > 0) {
                onChange([...photos, ...filesToAdd]);
            }
        },
        [photos, maxPhotos, onChange, t]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragOver(false);
            handleFileSelect(e.dataTransfer.files);
        },
        [handleFileSelect]
    );

    const removePhoto = (index: number) => {
        onChange(photos.filter((_, i) => i !== index));
    };

    const setAsMain = (index: number) => {
        if (index === 0) return;
        const newPhotos = [...photos];
        const [moved] = newPhotos.splice(index, 1);
        newPhotos.unshift(moved);
        onChange(newPhotos);
    };

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newPhotos = [...photos];
        const [moved] = newPhotos.splice(draggedIndex, 1);
        newPhotos.splice(index, 0, moved);
        onChange(newPhotos);
        setDraggedIndex(index);
    };

    const getPhotoUrl = (photo: string | File): string => {
        if (typeof photo === "string") return photo;
        return URL.createObjectURL(photo);
    };

    return (
        <div className="space-y-4">
            {label && (
                <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                        {label}
                    </label>
                    <span className="text-xs text-gray-400">
                        {photos.length}/{maxPhotos} photos • Min {minPhotos}
                    </span>
                </div>
            )}

            {/* Upload Zone */}
            <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${isDragOver
                    ? "border-[#B8071C] bg-[#B8071C]/5"
                    : "border-gray-300 hover:border-[#B8071C] hover:bg-gray-50"
                    }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    multiple
                    onChange={(e) => handleFileSelect(e.target.files)}
                    className="hidden"
                />
                <Upload
                    className={`w-10 h-10 mx-auto mb-3 ${isDragOver ? "text-[#B8071C]" : "text-gray-400"
                        }`}
                />
                <p className="text-sm font-medium text-[#103090]">
                    Drag & drop photos here
                </p>
                <p className="text-xs text-gray-500 mt-1">
                    or click to browse • JPG, PNG up to {MAX_FILE_SIZE_MB}MB each
                </p>
            </div>

            {/* Photo Grid */}
            {photos.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {photos.map((photo, index) => (
                        <div
                            key={index}
                            draggable
                            onDragStart={() => handleDragStart(index)}
                            onDragEnd={handleDragEnd}
                            onDragOver={(e) => handleDragOver(e, index)}
                            className={`group relative aspect-[4/3] rounded-lg overflow-hidden bg-gray-100 cursor-move ${draggedIndex === index ? "opacity-50" : ""
                                } ${index === 0 ? "ring-2 ring-[#B8071C]" : ""}`}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={getPhotoUrl(photo)}
                                alt={`Photo ${index + 1}`}
                                className="w-full h-full object-cover"
                            />

                            {/* Overlay */}
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all">
                                {/* Main Photo Badge */}
                                {index === 0 && (
                                    <div className="absolute top-2 left-2 bg-[#B8071C] text-white text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Star className="w-3 h-3" />
                                        Main
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    {index !== 0 && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setAsMain(index);
                                            }}
                                            className="w-7 h-7 rounded-full bg-white/90 flex items-center justify-center hover:bg-white transition-colors"
                                            title="Set as main photo"
                                        >
                                            <Star className="w-4 h-4 text-gray-600" />
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removePhoto(index);
                                        }}
                                        className="w-7 h-7 rounded-full bg-red-500/90 flex items-center justify-center hover:bg-red-500 transition-colors"
                                        title="Remove photo"
                                    >
                                        <X className="w-4 h-4 text-white" />
                                    </button>
                                </div>

                                {/* Drag Handle */}
                                <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <GripVertical className="w-5 h-5 text-white drop-shadow-lg" />
                                </div>

                                {/* Photo Number */}
                                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                    {index + 1}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Add More Button */}
                    {photos.length < maxPhotos && (
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="aspect-[4/3] rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 hover:border-[#B8071C] hover:bg-gray-50 transition-all"
                        >
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                            <span className="text-xs text-gray-500">Add more</span>
                        </button>
                    )}
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <span className="text-red-500 shrink-0 mt-0.5">⚠️</span>
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Validation Message */}
            {photos.length < minPhotos && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Please add at least {minPhotos} photos ({minPhotos - photos.length} more needed)
                </p>
            )}
        </div>
    );
}
