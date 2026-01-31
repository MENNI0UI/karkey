"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Star, GripVertical, Image as ImageIcon, Plus, Camera, Move } from "lucide-react";
import { validateImageFile } from "@/lib/validations";
import { useTranslation } from "@/lib/i18n-context";

// Enhanced Photo Interface
export interface PhotoItem {
    id: string; // unique id for key
    url: string; // preview or final url
    file?: File; // original file if not yet uploaded
    status: 'pending' | 'uploading' | 'completed' | 'error';
    error?: string;
    isMain?: boolean;
    uploadStartedAt?: number;
}

interface PhotoUploadGridProps {
    photos: PhotoItem[];
    onChange: (photos: PhotoItem[]) => void;
    maxPhotos?: number;
    minPhotos?: number;
    label?: string;
    error?: string;
}

export function PhotoUploadGrid({
    photos,
    onChange,
    maxPhotos = 10,
    minPhotos = 5,
    label,
    error
}: PhotoUploadGridProps) {
    const { t } = useTranslation();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [internalError, setInternalError] = useState<string | null>(null);

    const MAX_FILE_SIZE_MB = 20;

    const handleFileSelect = useCallback(
        (files: FileList | null) => {
            if (!files) return;
            setInternalError(null);

            const filesArray = Array.from(files);
            const validNewPhotos: PhotoItem[] = [];
            let lastError: string | null = null;

            // Limit total photos
            const remainingSlots = maxPhotos - photos.length;
            const filesToProcess = filesArray.slice(0, remainingSlots);

            for (const file of filesToProcess) {
                const validation = validateImageFile(file);
                if (validation.isValid) {
                    validNewPhotos.push({
                        id: Math.random().toString(36).substr(2, 9),
                        url: URL.createObjectURL(file), // Immediate local preview
                        file: file,
                        status: 'pending', // Parent will detect this and start upload
                        isMain: false
                    });
                } else {
                    lastError = validation.error || "validation.image_invalid";
                    console.warn(`[photo-upload] File rejected: ${file.name}`, validation.error);
                }
            }

            if (lastError) {
                setInternalError(t(lastError as any) || lastError);
                setTimeout(() => setInternalError(null), 8000);
            }

            if (validNewPhotos.length > 0) {
                onChange([...photos, ...validNewPhotos]);
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

    return (
        <div className="space-y-6">
            {/* Header with Counter */}
            <div className="flex items-end justify-between pb-2 border-b border-gray-100">
                <div className="space-y-1">
                    <label className="block text-[10px] font-black text-[#103090]/50 uppercase tracking-[0.2em] font-serif">
                        {label || t("wizard.upload.photos_title")}
                    </label>
                    <div className="flex items-center gap-2">
                        <Camera className="w-4 h-4 text-[#103090]" />
                        <span className="text-lg font-bold text-[#103090]">
                            {photos.length} <span className="text-gray-300 font-light mx-1">/</span> {maxPhotos}
                        </span>
                    </div>
                </div>
                {photos.length >= minPhotos ? (
                    <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full border border-emerald-100/50">
                        <Star className="w-3 h-3 fill-emerald-500" />
                        <span className="text-[10px] font-black uppercase tracking-wider leading-none">
                            {t("wizard.upload.min_photos")}
                        </span>
                    </div>
                ) : (
                    <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-100/50">
                        {minPhotos - photos.length} {t("wizard.photos.more_needed" as any) || "more needed"}
                    </div>
                )}
            </div>

            {/* Upload Zone & Photo Grid Wrapper */}
            <div className="space-y-4">
                {/* Main Upload Dropzone - Elegant & Large */}
                {photos.length === 0 && (
                    <div
                        onDrop={handleDrop}
                        onDragOver={(e) => {
                            e.preventDefault();
                            setIsDragOver(true);
                        }}
                        onDragLeave={() => setIsDragOver(false)}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative group overflow-hidden border-2 border-dashed rounded-[32px] p-16 text-center cursor-pointer transition-all duration-500 ${isDragOver
                            ? "border-[#103090] bg-[#103090]/5 scale-[0.99]"
                            : "border-gray-200 hover:border-[#103090] hover:bg-white hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)]"
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
                        <div className="relative inline-flex mb-6">
                            <div className="w-20 h-20 bg-[#103090]/5 rounded-3xl flex items-center justify-center transition-all duration-500 group-hover:bg-[#103090] group-hover:scale-110 group-hover:rotate-6">
                                <Upload className={`w-8 h-8 transition-colors duration-500 ${isDragOver ? "text-[#103090]" : "text-[#103090] group-hover:text-white"}`} />
                            </div>
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center animate-bounce">
                                <Plus className="w-4 h-4 text-[#B8071C]" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-[#103090] mb-2 font-serif">
                            {t("wizard.upload.click_to_upload") || "Select Vehicle Photos"}
                        </h3>
                        <p className="text-sm text-gray-500 max-w-xs mx-auto font-medium">
                            {t("wizard.upload.photos_desc") || "Drag & drop your high-resolution images here (JPG or PNG)"}
                        </p>
                    </div>
                )}

                {/* Photo Grid */}
                {photos.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {photos.map((photo, index) => (
                            <div
                                key={photo.id}
                                draggable
                                onDragStart={() => handleDragStart(index)}
                                onDragEnd={handleDragEnd}
                                onDragOver={(e) => handleDragOver(e, index)}
                                className={`group relative aspect-[4/3] rounded-2xl overflow-hidden bg-gray-50 cursor-move transition-all duration-300 ${draggedIndex === index ? "opacity-30 scale-95" : "hover:scale-[1.02] shadow-sm hover:shadow-md"
                                    } ${index === 0 ? "ring-2 ring-[#103090] ring-offset-2" : "border border-gray-100"}`}
                            >
                                {/* Photo numbering - Magazine style */}
                                <div className={`absolute top-3 left-3 z-30 w-7 h-7 rounded-full flex items-center justify-center backdrop-blur-md text-[10px] font-black transition-all duration-300 ${index === 0
                                        ? "bg-[#103090] text-white"
                                        : "bg-black/20 text-white group-hover:bg-white group-hover:text-[#103090]"
                                    }`}>
                                    {String(index + 1).padStart(2, '0')}
                                </div>

                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={photo.url}
                                    alt={`Hero ${index + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />

                                {/* Status Overlays */}
                                {photo.status === 'uploading' && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center z-20">
                                        <div className="w-8 h-8 border-2 border-[#103090]/20 border-t-[#103090] rounded-full animate-spin" />
                                    </div>
                                )}

                                {photo.status === 'error' && (
                                    <div className="absolute inset-0 bg-red-50/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-2 z-20 p-2">
                                        <X className="w-6 h-6 text-red-500" />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newPhotos = [...photos];
                                                newPhotos[index] = { ...photo, status: 'pending', error: undefined };
                                                onChange(newPhotos);
                                            }}
                                            className="bg-red-500 text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full hover:bg-red-600 transition-colors"
                                        >
                                            RETRY
                                        </button>
                                    </div>
                                )}

                                {/* Hover Control Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#103090]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 z-20">
                                    {/* Action Buttons */}
                                    <div className="absolute top-3 right-3 flex items-center gap-2">
                                        {index !== 0 && (
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setAsMain(index);
                                                }}
                                                className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-[#DEB735] hover:text-white transition-all transform hover:scale-110"
                                                title={t("wizard.photos.promote_to_hero")}
                                            >
                                                <Star className="w-4 h-4 fill-current" />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                removePhoto(index);
                                            }}
                                            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-[#B8071C] transition-all transform hover:scale-110"
                                            title="Remove"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Hero / Drag Labels */}
                                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                                        {index === 0 ? (
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-[#DEB735] animate-pulse" />
                                                <span className="text-[10px] font-black text-[#DEB735] uppercase tracking-widest leading-none">
                                                    {t("wizard.photos.hero_photo") || "Hero Photo"}
                                                </span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-white/70">
                                                <Move className="w-3 h-3" />
                                                <span className="text-[9px] font-black uppercase tracking-widest">
                                                    {t("wizard.photos.drag_to_reorder") || "Drag to move"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Interactive "Add More" Button */}
                        {photos.length > 0 && photos.length < maxPhotos && (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="group relative aspect-[4/3] rounded-2xl border-2 border-dashed border-gray-100 bg-white flex flex-col items-center justify-center gap-3 hover:border-[#103090] hover:bg-gray-50 transition-all duration-500 overflow-hidden"
                            >
                                <div className="p-4 rounded-full bg-gray-50 group-hover:bg-[#103090] group-hover:scale-110 transition-all duration-500">
                                    <Plus className="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" />
                                </div>
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-[#103090]">
                                    {t("wizard.upload.upload") || "Add More"}
                                </span>

                                <div className="absolute inset-x-0 bottom-3 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-[8px] font-bold text-[#103090]/40 uppercase tracking-tighter">
                                        {maxPhotos - photos.length} slots left
                                    </span>
                                </div>
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Global Error Banner */}
            {(error || internalError) && (
                <div className="p-4 bg-red-50/50 border border-red-100 rounded-2xl flex items-start gap-3 animate-shake">
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                        <X className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-red-700">{error || internalError}</p>
                        <p className="text-xs text-red-500 mt-0.5">Please check your file types or sizes.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
