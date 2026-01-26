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

    // Simplified Handler
    const handlePhotosChange = (newPhotos: PhotoItem[]) => {
        // 1. Update State first
        update({ photos: newPhotos })

        // 2. Trigger Uploads for new pending items
        // We identify new items by 'pending' status.
        // Important: We must not trigger if already uploading.
        // Since 'newPhotos' comes from the Grid, pending items are fresh drops.
        newPhotos.forEach(p => {
            if (p.status === 'pending' && p.file) {
                // Trigger upload in parent
                // Parent handles state update to 'uploading'
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
                                Photograph in natural daylight
                            </li>
                            <li className="flex items-start gap-3 text-base text-gray-600">
                                <span className="text-gray-400 mt-0.5">•</span>
                                Include all angles: front, rear, both sides
                            </li>
                            <li className="flex items-start gap-3 text-base text-gray-600">
                                <span className="text-gray-400 mt-0.5">•</span>
                                Show interior: dashboard, seats, trunk
                            </li>
                            <li className="flex items-start gap-3 text-base text-gray-600">
                                <span className="text-gray-400 mt-0.5">•</span>
                                Document any damage or wear honestly
                            </li>
                        </ul>
                    </div>

                    {/* Avoid */}
                    <div>
                        <h4 className="text-sm font-bold text-gray-500 uppercase mb-4 font-serif">{t("avoid")}</h4>
                        <ul className="space-y-2">
                            <li className="flex items-start gap-3 text-base text-gray-600">
                                <span className="text-gray-400 mt-0.5">•</span>
                                Personal information visible (phone, email)
                            </li>
                            <li className="flex items-start gap-3 text-base text-gray-600">
                                <span className="text-gray-400 mt-0.5">•</span>
                                Blurry or poorly lit images
                            </li>
                            <li className="flex items-start gap-3 text-base text-gray-600">
                                <span className="text-gray-400 mt-0.5">•</span>
                                Concealing damage or defects
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Recommended Shots */}
                <div className="mt-6 pt-5 border-t border-gray-100">
                    <h4 className="text-sm font-bold text-gray-500 uppercase mb-5 font-serif">{t("recommendedShots")}</h4>
                    <div className="flex flex-wrap gap-2">
                        {["Exterior Front", "Exterior Rear", "Driver Side", "Passenger Side", "Dashboard", "Front Seats", "Rear Seats", "Engine Bay", "Trunk/Boot", "Wheels"].map((shot, i) => (
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
