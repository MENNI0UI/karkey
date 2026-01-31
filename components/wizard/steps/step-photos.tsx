import React from "react"
import { useTranslation } from "@/lib/i18n-context"
import { WizardCard } from "@/components/ui/wizard-card"
import { PhotoItem, PhotoUploadGrid } from "@/components/ui/photo-upload-grid"
import { Camera, Sun, Maximize, LayoutGrid, Info, CheckCircle2, AlertCircle, Sparkles } from "lucide-react"

type StepProps = {
    data: any
    update: (patch: any) => void
    t: (key: string) => string
    onUpload: (file: File, id: string) => void
    errors?: Record<string, string>
}

export function StepPhotos({ data, update, t, onUpload, errors = {} }: StepProps) {
    const { t: translate } = useTranslation()
    const photos: PhotoItem[] = data.photos || []
    const uploadingCount = photos.filter(p => p.status === 'uploading').length
    const errorCount = photos.filter(p => p.status === 'error').length

    // Simplified Handler
    const handlePhotosChange = (newPhotos: PhotoItem[]) => {
        // 1. Update State first
        update({ photos: newPhotos })

        // 2. Trigger Uploads for new pending items
        newPhotos.forEach(p => {
            if (p.status === 'pending' && p.file) {
                onUpload(p.file, p.id)
            }
        })
    }

    const handleRetryAll = () => {
        photos.forEach(p => {
            if (p.status === 'error' && p.file) {
                onUpload(p.file, p.id)
            }
        })
    }

    return (
        <div className="space-y-12">
            {/* 1. Gallery Manager Section */}
            <WizardCard
                title={t("photosTitle") || translate("wizard.sections.photos" as any)}
                stepIndicator={translate("wizard.progress.step_of", { current: 2, total: 5 })}
                subtitle={translate("wizard.photos.coach_subtitle")}
                className="overflow-visible"
            >
                {/* Validation Error Banner */}
                {errors.photos && (
                    <div className="mb-6 p-4 bg-red-50/50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-700 animate-in fade-in slide-in-from-top-1">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="font-bold text-sm tracking-tight">{errors.photos}</p>
                    </div>
                )}

                <PhotoUploadGrid
                    photos={photos}
                    onChange={handlePhotosChange}
                    minPhotos={5}
                    maxPhotos={10}
                    label={translate("wizard.photos.drag_to_reorder")}
                />

                {/* Upload Status Bar */}
                {(uploadingCount > 0 || errorCount > 0) && (
                    <div className={`mt-8 p-5 rounded-2xl border flex items-center justify-between animate-in fade-in slide-in-from-bottom-2 transition-all duration-500 ${errorCount > 0
                            ? "bg-red-50/40 border-red-100 text-red-700 shadow-[0_10px_30px_rgba(239,68,68,0.05)]"
                            : "bg-blue-50/40 border-blue-100 text-[#103090] shadow-[0_10px_30px_rgba(16,48,144,0.05)]"
                        }`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${errorCount > 0 ? "bg-red-500 text-white" : "bg-[#103090] text-white"
                                }`}>
                                {errorCount > 0 ? <AlertCircle className="w-5 h-5" /> : <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                            </div>
                            <div>
                                <p className="text-sm font-black uppercase tracking-tight">
                                    {errorCount > 0
                                        ? translate("wizard.photos.upload_failed", { count: errorCount })
                                        : translate("wizard.photos.wait_for_uploads")
                                    }
                                </p>
                                <p className="text-[11px] opacity-70 font-medium tracking-wide">
                                    {errorCount > 0
                                        ? translate("wizard.photos.must_fix_errors")
                                        : translate("wizard.photos.next_enabled")
                                    }
                                </p>
                            </div>
                        </div>

                        {errorCount > 0 && (
                            <button
                                onClick={handleRetryAll}
                                className="px-5 py-2.5 bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-600 transition-all shadow-lg active:scale-95"
                            >
                                {translate("wizard.photos.retry_all")}
                            </button>
                        )}
                    </div>
                )}
            </WizardCard>

            {/* 2. Photography Coach Section - Editorial Layout */}
            <div className="space-y-8 pb-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-gray-100 pb-6 mb-8">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-[#DEB735]" />
                            <h3 className="text-[10px] font-black text-[#103090]/60 uppercase tracking-[0.3em] font-serif">
                                {translate("wizard.photos.coach_title")}
                            </h3>
                        </div>
                        <h2 className="text-2xl font-bold text-[#103090] font-serif tracking-tight">
                            {translate("wizard.photos.coach_subtitle")}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] font-black text-[#103090] uppercase tracking-wider bg-blue-50/50 px-4 py-2 rounded-full border border-blue-100/50">
                        <Info className="w-3.5 h-3.5" />
                        <span>Professional Standard</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Lighting & Setting */}
                    <div className="bg-white/40 p-6 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-xl transition-all duration-500 group">
                        <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-6 group-hover:scale-110 group-hover:bg-amber-100 transition-all">
                            <Sun className="w-6 h-6" />
                        </div>
                        <h4 className="text-lg font-bold text-[#103090] mb-3 font-serif line-clamp-1">{translate("wizard.photos.best_practices")}</h4>
                        <ul className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <li key={i} className="flex items-start gap-2.5 text-xs text-gray-500 font-medium leading-relaxed">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                    {translate(`wizard.photos.best_practice_${i}` as any)}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Angles & Details */}
                    <div className="bg-white/40 p-6 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-xl transition-all duration-500 group">
                        <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 mb-6 group-hover:scale-110 group-hover:bg-blue-100 transition-all">
                            <Camera className="w-6 h-6" />
                        </div>
                        <h4 className="text-lg font-bold text-[#103090] mb-3 font-serif line-clamp-1">{translate("wizard.photos.coach_title")}</h4>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2.5 text-xs text-gray-500 font-medium leading-relaxed">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                {translate("wizard.photos.best_practice_4")}
                            </li>
                            <li className="flex items-start gap-2.5 text-xs text-gray-500 font-medium leading-relaxed">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                {translate("wizard.photos.shot_5")}
                            </li>
                            <li className="flex items-start gap-2.5 text-xs text-gray-500 font-medium leading-relaxed">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                {translate("wizard.photos.shot_8")}
                            </li>
                        </ul>
                    </div>

                    {/* What to Avoid */}
                    <div className="bg-white/40 p-6 rounded-3xl border border-gray-100 hover:bg-white hover:shadow-xl transition-all duration-500 group">
                        <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 mb-6 group-hover:scale-110 group-hover:bg-red-100 transition-all">
                            <Maximize className="w-6 h-6" />
                        </div>
                        <h4 className="text-lg font-bold text-red-700 mb-3 font-serif line-clamp-1">{translate("wizard.photos.avoid")}</h4>
                        <ul className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <li key={i} className="flex items-start gap-2.5 text-xs text-gray-500 font-medium leading-relaxed">
                                    <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                                    {translate(`wizard.photos.avoid_${i}` as any)}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    )
}
