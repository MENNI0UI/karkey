import React, { useRef } from "react"
import { useTranslation } from "@/lib/i18n-context"
import { WizardCard } from "@/components/ui/wizard-card"
import { Check, FileText } from "lucide-react"
import { validateImageFile } from "@/lib/validations"

type StepProps = {
    data: any
    update: (patch: any) => void
    t: (key: string) => string
    onUpload: (file: File, type: 'carte_grise' | 'service_history') => void
}

export function StepDocuments({ data, update, t, onUpload }: StepProps) {
    const { t: translate } = useTranslation()
    const registrationInputRef = useRef<HTMLInputElement>(null)
    const serviceInputRef = useRef<HTMLInputElement>(null)

    return (
        <WizardCard
            title={t("documentsTitle")}
            stepIndicator={translate("wizard.progress.step_of", { current: 3, total: 5 })}
            subtitle={t("documentsSubtitle")}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Carte Grise */}
                <div
                    onClick={() => registrationInputRef.current?.click()}
                    className={`p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${data.registration_doc
                        ? "border-green-400 bg-green-50"
                        : "border-gray-300 hover:border-[#B8071C] hover:bg-gray-50"
                        }`}
                >
                    <input
                        ref={registrationInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                                const validation = validateImageFile(file, true)
                                if (validation.isValid) {
                                    update({ registration_doc: file })
                                    onUpload(file, 'carte_grise')
                                } else {
                                    alert(t(validation.error as any) || validation.error)
                                }
                            }
                        }}
                        className="hidden"
                    />
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${data.registration_doc ? "bg-green-100" : "bg-gray-100"
                            }`}>
                            {data.registration_doc ? (
                                <Check className="w-6 h-6 text-green-600" />
                            ) : (
                                <FileText className="w-6 h-6 text-gray-400" />
                            )}
                        </div>
                        <div>
                            <p className="font-medium text-[#103090]">{t("carteGrise")} *</p>
                            <p className="text-sm text-gray-500">
                                {data.registration_doc instanceof File
                                    ? data.registration_doc.name
                                    : data.registration_doc ? t("fileUploaded") : t("clickToUpload")}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Service History (Optional) */}
                <div
                    onClick={() => serviceInputRef.current?.click()}
                    className={`p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${data.service_history
                        ? "border-green-400 bg-green-50"
                        : "border-gray-300 hover:border-[#B8071C] hover:bg-gray-50"
                        }`}
                >
                    <input
                        ref={serviceInputRef}
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                                const validation = validateImageFile(file, true)
                                if (validation.isValid) {
                                    update({ service_history: file })
                                    onUpload(file, 'service_history')
                                } else {
                                    alert(t(validation.error as any) || validation.error)
                                }
                            }
                        }}
                        className="hidden"
                    />
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${data.service_history ? "bg-green-100" : "bg-gray-100"
                            }`}>
                            {data.service_history ? (
                                <Check className="w-6 h-6 text-green-600" />
                            ) : (
                                <FileText className="w-6 h-6 text-gray-400" />
                            )}
                        </div>
                        <div>
                            <p className="font-medium text-[#103090]">{t("serviceHistory")}</p>
                            <p className="text-sm text-gray-500">
                                {data.service_history instanceof File
                                    ? data.service_history.name
                                    : data.service_history ? t("fileUploaded") : t("optionalClick")}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </WizardCard>
    )
}
