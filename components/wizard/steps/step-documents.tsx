import React, { useRef } from "react"
import { useTranslation } from "@/lib/i18n-context"
import { WizardCard } from "@/components/ui/wizard-card"
import { Check, FileText, AlertCircle, ShieldCheck, Lock, Activity, Eye, ShieldAlert } from "lucide-react"
import { validateImageFile } from "@/lib/validations"
import { useToast } from "@/hooks/use-toast"

type StepProps = {
    data: any
    update: (patch: any) => void
    t: (key: string) => string
    onUpload: (file: File, type: 'carte_grise' | 'service_history') => void
    errors?: Record<string, string>
}

export function StepDocuments({ data, update, t, onUpload, errors = {} }: StepProps) {
    const { t: translate, language } = useTranslation()
    const { toast } = useToast()
    const registrationInputRef = useRef<HTMLInputElement>(null)
    const serviceInputRef = useRef<HTMLInputElement>(null)

    const DocumentLocker = ({
        id,
        label,
        isRequired,
        isUploaded,
        fileName,
        error,
        onClick,
        icon: Icon
    }: {
        id: string,
        label: string,
        isRequired?: boolean,
        isUploaded: boolean,
        fileName?: string,
        error?: string,
        onClick: () => void,
        icon: any
    }) => (
        <div
            onClick={onClick}
            className={`group relative overflow-hidden rounded-3xl transition-all duration-500 cursor-pointer ${isUploaded
                ? "bg-emerald-50/40 border-emerald-200/60 shadow-[0_10px_30px_rgba(16,185,129,0.05)]"
                : error
                    ? "bg-red-50/40 border-red-200/60 shadow-[0_10px_30px_rgba(239,68,68,0.05)]"
                    : "bg-white/40 border-gray-100/60 hover:bg-white/60 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)]"
                } border p-8 radiant-focus`}
        >
            {/* Background Security Pattern */}
            <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none group-hover:scale-110 transition-transform duration-700">
                <Lock className="w-32 h-32" />
            </div>

            <div className="flex flex-col gap-6">
                <div className="flex items-start justify-between">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-sm ${isUploaded
                        ? "bg-emerald-500 text-white rotate-6"
                        : error
                            ? "bg-red-500 text-white animate-shake"
                            : "bg-[#103090]/5 text-[#103090] group-hover:bg-[#103090] group-hover:text-white"
                        }`}>
                        {isUploaded ? (
                            <ShieldCheck className="w-7 h-7" />
                        ) : error ? (
                            <ShieldAlert className="w-7 h-7" />
                        ) : (
                            <Icon className="w-7 h-7" />
                        )}
                    </div>

                    {isUploaded && (
                        <div className="flex items-center gap-1.5 bg-emerald-100/50 px-3 py-1 rounded-full border border-emerald-200/50">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">
                                {translate("wizard.documents.secured")}
                            </span>
                        </div>
                    )}
                </div>

                <div className="space-y-1">
                    <h4 className={`text-lg font-bold font-serif ${error ? "text-red-700" : "text-[#103090]"}`}>
                        {label} {isRequired && <span className="text-[#B8071C]">*</span>}
                    </h4>
                    <p className={`text-[12px] font-medium tracking-tight h-5 leading-tight ${isUploaded ? "text-emerald-600" : error ? "text-red-500" : "text-gray-500"
                        }`}>
                        {isUploaded
                            ? (fileName || translate("wizard.upload.document_uploaded"))
                            : error
                                ? error
                                : translate("wizard.documents.click_to_secure")
                        }
                    </p>
                </div>

                <div className={`mt-2 flex items-center gap-4 pt-6 border-t ${isUploaded ? "border-emerald-100/40" : "border-gray-50"
                    }`}>
                    <div className="flex items-center gap-2">
                        <Activity className={`w-3.5 h-3.5 ${isUploaded ? "text-emerald-400" : "text-gray-300"}`} />
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.15em]">
                            {translate("wizard.documents.verified_encryption")}
                        </span>
                    </div>
                </div>
            </div>

            {/* Hover Action Label */}
            {!isUploaded && !error && (
                <div className="absolute bottom-6 right-8 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
                    <div className="flex items-center gap-2 text-[#103090] text-[10px] font-black uppercase tracking-widest">
                        <span>{translate("wizard.upload.upload")}</span>
                        <Activity className="w-3 h-3 animate-pulse" />
                    </div>
                </div>
            )}
        </div>
    )

    return (
        <WizardCard
            title={t("documentsTitle") || translate("wizard.sections.documents" as any)}
            stepIndicator={translate("wizard.progress.step_of", { current: 3, total: 5 })}
            subtitle={t("documentsSubtitle") || translate("wizard.steps.documents_desc")}
        >
            <div className="space-y-10">
                {/* Section Header: Secure Storage */}
                <div className="flex items-center justify-between pb-6 border-b border-gray-100/60">
                    <div>
                        <h3 className="text-[11px] font-black text-[#103090]/50 uppercase tracking-[0.3em] font-serif mb-1">
                            {translate("wizard.documents.secure_locker")}
                        </h3>
                        <p className="text-[12px] text-gray-400 font-sans tracking-wide">
                            {translate("wizard.photos.best_practice_4")}
                        </p>
                    </div>
                    <div className="flex -space-x-3 rtl:space-x-reverse">
                        <div className="w-10 h-10 rounded-full border-2 border-white bg-blue-50 flex items-center justify-center text-[#103090] shadow-sm">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div className="w-10 h-10 rounded-full border-2 border-white bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm leading-none">
                            <span className="text-[10px] font-black">SSL</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
                    {/* Carte Grise */}
                    <div className="relative">
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
                                        toast({
                                            title: "Invalid File",
                                            description: t(validation.error as any) || validation.error,
                                            variant: "destructive"
                                        })
                                    }
                                }
                            }}
                            className="hidden"
                        />
                        <DocumentLocker
                            id="registration"
                            label={t("carteGrise") || "Carte Grise"}
                            isRequired
                            isUploaded={!!data.registration_doc}
                            fileName={data.registration_doc instanceof File ? data.registration_doc.name : undefined}
                            error={errors.registration_doc}
                            onClick={() => registrationInputRef.current?.click()}
                            icon={FileText}
                        />
                    </div>

                    {/* Service History */}
                    <div className="relative">
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
                                        toast({
                                            title: "Invalid File",
                                            description: t(validation.error as any) || validation.error,
                                            variant: "destructive"
                                        })
                                    }
                                }
                            }}
                            className="hidden"
                        />
                        <DocumentLocker
                            id="service_history"
                            label={t("serviceHistory") || "Service History"}
                            isUploaded={!!data.service_history}
                            fileName={data.service_history instanceof File ? data.service_history.name : undefined}
                            onClick={() => serviceInputRef.current?.click()}
                            icon={Activity}
                        />
                    </div>
                </div>

                {/* Secure Note */}
                <div className="p-6 bg-blue-50/30 rounded-2xl border border-blue-100/30 flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-white border border-blue-100 flex items-center justify-center shadow-sm flex-shrink-0">
                        <Lock className="w-5 h-5 text-[#103090]" />
                    </div>
                    <div>
                        <h5 className="text-[11px] font-black text-[#103090] uppercase tracking-wider mb-1">
                            {translate("wizard.documents.verified_encryption")}
                        </h5>
                        <p className="text-[12px] text-[#103090]/60 leading-relaxed font-sans font-medium">
                            {translate("wizard.photos.best_practice_4")}
                        </p>
                    </div>
                </div>
            </div>
        </WizardCard>
    )
}
