import React from "react"
import { useTranslation } from "@/lib/i18n-context"
import { WizardCard } from "@/components/ui/wizard-card"
import { PhotoItem, PhotoUploadGrid } from "@/components/ui/photo-upload-grid"

type StepProps = {
    data: any
    update: (patch: any) => void
    t: (key: string) => string
    onUpload: (file: File, id: string) => void
}

export function StepPhotos({ data, update, t, onUpload }: StepProps) {
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
        <div className="space-y-6">
            <WizardCard
                title={t("photosTitle")}
                stepIndicator={translate("wizard.progress.step_of", { current: 2, total: 5 })}
                subtitle={t("photosSubtitle")}
            >
                <PhotoUploadGrid
                    photos={photos}
                    onChange={handlePhotosChange}
                    minPhotos={5}
                    maxPhotos={10}
                    label={t("photos")}
                />

                {/* Upload Safety Guard UI */}
                {(uploadingCount > 0 || errorCount > 0) && (
                    <div className={`mt-4 p-4 rounded-xl border-2 flex items-center justify-between animate-in fade-in slide-in-from-top-1 ${errorCount > 0 ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100"}`}>
                        <div className="flex items-center gap-3">
                            <span className="text-xl">{errorCount > 0 ? "⚠️" : "⏳"}</span>
                            <div>
                                <p className={`text-sm font-bold ${errorCount > 0 ? "text-red-700" : "text-blue-700"}`}>
                                    {errorCount > 0
                                        ? translate("wizard.photos.upload_failed", { count: errorCount })
                                        : translate("wizard.photos.wait_for_uploads")
                                    }
                                </p>
                                <p className="text-xs text-gray-500">
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
                                className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                            >
                                {translate("wizard.photos.retry_all")}
                            </button>
                        )}
                    </div>
                )}
            </WizardCard>

            {/* Photography Guidelines */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h3 className="text-base font-bold text-[#103090] uppercase tracking-wide mb-6 font-serif">
                    {t("photographyGuidelines")}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Best Practices */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 font-serif">{t("bestPractices")}</h4>
                        <ul className="space-y-2">
                            <li className="flex items-start gap-3 text-base text-gray-600">
                                <span className="text-gray-400 mt-0.5">•</span>
                                {translate("wizard.photos.best_practice_1")}
                            </li>
                            <li className="flex items-start gap-3 text-base text-gray-600">
                                <span className="text-gray-400 mt-0.5">•</span>
                                {translate("wizard.photos.best_practice_2")}
                            </li>
                            <li className="flex items-start gap-3 text-base text-gray-600">
                                <span className="text-gray-400 mt-0.5">•</span>
                                {translate("wizard.photos.best_practice_3")}
                            </li>
                            <li className="flex items-start gap-3 text-base text-gray-600">
                                <span className="text-gray-400 mt-0.5">•</span>
                                {translate("wizard.photos.best_practice_4")}
                            </li>
                        </ul>
                    </div>

                    {/* Avoid */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 font-serif">{t("avoid")}</h4>
                        <ul className="space-y-2">
                            <li className="flex items-start gap-3 text-base text-gray-600">
                                <span className="text-gray-400 mt-0.5">•</span>
                                {translate("wizard.photos.avoid_1")}
                            </li>
                            <li className="flex items-start gap-3 text-base text-gray-600">
                                <span className="text-gray-400 mt-0.5">•</span>
                                {translate("wizard.photos.avoid_2")}
                            </li>
                            <li className="flex items-start gap-3 text-base text-gray-600">
                                <span className="text-gray-400 mt-0.5">•</span>
                                {translate("wizard.photos.avoid_3")}
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Recommended Shots */}
                <div className="mt-6 pt-5 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-5 font-serif">{t("recommendedShots")}</h4>
                    <div className="flex flex-wrap gap-2">
                        {[
                            translate("wizard.photos.shot_1"),
                            translate("wizard.photos.shot_2"),
                            translate("wizard.photos.shot_3"),
                            translate("wizard.photos.shot_4"),
                            translate("wizard.photos.shot_5"),
                            translate("wizard.photos.shot_6"),
                            translate("wizard.photos.shot_7"),
                            translate("wizard.photos.shot_8"),
                            translate("wizard.photos.shot_9"),
                            translate("wizard.photos.shot_10")
                        ].map((shot, i) => (
                            <span
                                key={i}
                                className="px-4 py-2 bg-gray-50 text-gray-700 text-sm font-medium rounded-full border border-gray-200"
                            >
                                {shot}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
