import React from "react"
import { useTranslation } from "@/lib/i18n-context"
import { MinimalSelect, MinimalTextInput, MinimalTextarea, MinimalInputWrapper } from "@/components/ui/minimal-input"
import { WizardCard } from "@/components/ui/wizard-card"
import { ColorDropdown } from "@/components/ui/color-dropdown"
import { Check } from "lucide-react"

type StepProps = {
    data: any
    update: (patch: any) => void
    t: (key: string) => string
    models: string[]
    errors?: Record<string, string>
}

const makes = ["Kia", "Toyota", "Honda", "BMW", "Mercedes", "Hyundai", "Renault", "Peugeot", "Dacia", "Volkswagen"]
const years = Array.from({ length: 36 }).map((_, i) => String(2025 - i)) // Updated to 2025 descending
const locations = ["Casablanca", "Rabat", "Mohammedia", "Tangier", "Marrakesh", "Fes", "Agadir", "Meknes", "Oujda"]

export function StepCarDetails({ data, update, t, models, errors = {} }: StepProps) {
    const { t: translate, language: currentLang } = useTranslation()
    const needsEngine = data.fuel_type !== "Electric"
    const descriptionLength = String(data.description || "").length

    const conditions = [
        { value: "excellent", label: t("excellent") },
        { value: "good", label: t("good") },
        { value: "fair", label: t("fair") },
        { value: "poor", label: t("poor") },
    ]

    const fuelTypes = [
        { value: "Petrol", label: t("petrol") },
        { value: "Diesel", label: t("diesel") },
        { value: "Electric", label: t("electric") },
        { value: "Hybrid", label: t("hybrid") },
    ]

    const transmissions = [
        { value: "Automatic", label: t("automatic") },
        { value: "Manual", label: t("manual") },
    ]

    const doorOptions = [
        { value: "2", label: `2 ${translate("vehicle.doors")}` },
        { value: "3", label: `3 ${translate("vehicle.doors")}` },
        { value: "4", label: `4 ${translate("vehicle.doors")}` },
        { value: "5", label: `5 ${translate("vehicle.doors")}` },
    ]

    return (
        <div className="space-y-10 pb-10">
            {/* Section 1: Core Vehicle Identity */}
            <WizardCard
                title={t("vehicleInfo")}
                stepIndicator={translate("wizard.progress.step_of", { current: 1, total: 5 })}
                subtitle={translate("wizard.subtitle.step1")}
            >
                <div className="space-y-8">
                    {/* Cluster: Brand Identity */}
                    <div>
                        <h3 className="text-[10px] font-black text-[#103090]/50 uppercase tracking-[0.2em] mb-5 font-serif">
                            {translate("wizard.cluster.brand_identity" as any) || "Brand Identity"}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <MinimalSelect
                                label={t("make")}
                                required
                                value={data.make || ""}
                                onChange={(e) => update({ make: e.target.value, model: "" })}
                                options={makes.map((m) => ({ value: m, label: m }))}
                                placeholder={t("select")}
                                error={errors.make}
                            />
                            <MinimalSelect
                                label={t("model")}
                                required
                                value={data.model || ""}
                                onChange={(e) => update({ model: e.target.value })}
                                options={models.map((m: string) => ({ value: m, label: m }))}
                                placeholder={t("select")}
                                disabled={!data.make}
                                error={errors.model}
                            />
                            <MinimalSelect
                                label={t("year")}
                                required
                                value={data.year || ""}
                                onChange={(e) => update({ year: e.target.value })}
                                options={years.map((y) => ({ value: y, label: y }))}
                                placeholder={t("select")}
                                error={errors.year}
                            />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="cluster-divider" />

                    {/* Cluster: Location */}
                    <div>
                        <h3 className="text-[10px] font-black text-[#103090]/50 uppercase tracking-[0.2em] mb-5 font-serif">
                            {translate("wizard.cluster.location" as any) || "Location"}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <MinimalSelect
                                label={t("location")}
                                required
                                value={data.location || ""}
                                onChange={(e) => update({ location: e.target.value })}
                                options={locations.map((l) => ({
                                    value: l,
                                    label: translate(`location.city.${l.toLowerCase().replace(/\s+/g, '')}` as any) || l
                                }))}
                                placeholder={t("select")}
                                error={errors.location}
                            />
                        </div>
                    </div>
                </div>
            </WizardCard>

            {/* Section 2: Technical Specifications */}
            <WizardCard title={t("specifications") || "Technical Specs"}>
                <div className="space-y-8">
                    {/* Cluster: Performance DNA */}
                    <div>
                        <h3 className="text-[10px] font-black text-[#103090]/50 uppercase tracking-[0.2em] mb-5 font-serif">
                            {translate("wizard.cluster.performance" as any) || "Performance DNA"}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <MinimalTextInput
                                label={t("mileage")}
                                required
                                type="number"
                                step={100}
                                value={data.mileage || ""}
                                onChange={(e) => update({ mileage: e.target.value })}
                                placeholder={t("wizard.placeholders.mileage")}
                                suffix={t("unit.km")}
                                error={errors.mileage}
                            />
                            <MinimalSelect
                                label={t("fuelType")}
                                required
                                value={data.fuel_type || ""}
                                onChange={(e) => update({ fuel_type: e.target.value })}
                                options={fuelTypes}
                                placeholder={t("select")}
                                error={errors.fuel_type}
                            />
                            <MinimalSelect
                                label={t("transmission")}
                                required
                                value={data.transmission || ""}
                                onChange={(e) => update({ transmission: e.target.value })}
                                options={transmissions}
                                placeholder={t("select")}
                                error={errors.transmission}
                            />
                            {needsEngine && (
                                <MinimalTextInput
                                    label={t("engineSize")}
                                    required
                                    type="number"
                                    step={0.1}
                                    decimals={1}
                                    value={data.engine_size || ""}
                                    onChange={(e) => update({ engine_size: e.target.value })}
                                    placeholder={t("wizard.placeholders.engine_size")}
                                    suffix={t("unit.liter")}
                                    error={errors.engine_size}
                                />
                            )}
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="cluster-divider" />

                    {/* Cluster: Body & Condition */}
                    <div>
                        <h3 className="text-[10px] font-black text-[#103090]/50 uppercase tracking-[0.2em] mb-5 font-serif">
                            {translate("wizard.cluster.body_condition" as any) || "Body & Condition"}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <MinimalSelect
                                label={t("condition")}
                                required
                                value={data.condition || ""}
                                onChange={(e) => update({ condition: e.target.value })}
                                options={conditions}
                                placeholder={t("select")}
                                error={errors.condition}
                            />
                            <MinimalSelect
                                label={t("doors")}
                                required
                                value={data.doors || ""}
                                onChange={(e) => update({ doors: e.target.value })}
                                options={doorOptions}
                                placeholder={t("select")}
                                error={errors.doors}
                            />
                        </div>
                    </div>
                </div>
            </WizardCard>

            {/* Section 3: Appearance & Style */}
            <WizardCard title={t("appearance") || "Appearance & Colors"}>
                <div className="space-y-8">
                    {/* Cluster: Visual Identity */}
                    <div>
                        <h3 className="text-[10px] font-black text-[#103090]/50 uppercase tracking-[0.2em] mb-5 font-serif">
                            {translate("wizard.cluster.visual_identity" as any) || "Visual Identity"}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <MinimalInputWrapper
                                    label={t("exteriorColor")}
                                    required
                                    error={errors.exterior_color}
                                >
                                    <ColorDropdown
                                        value={data.exterior_color || ""}
                                        onChange={(v) => update({ exterior_color: v })}
                                        minimal
                                    />
                                </MinimalInputWrapper>

                                {/* Directly related: Original Paint */}
                                <div className="pt-1">
                                    <label className="group flex items-center gap-4 p-4 bg-gray-50/50 rounded-2xl cursor-pointer hover:bg-red-50/30 border border-gray-100/50 hover:border-red-100 transition-all duration-300 w-full h-[58px]">
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${data.is_original_paint
                                            ? "bg-[#B8071C] border-[#B8071C] shadow-lg shadow-red-500/20 scale-105"
                                            : "border-gray-200 bg-white group-hover:border-gray-300"
                                            }`}>
                                            {data.is_original_paint && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                                        </div>
                                        <input
                                            type="checkbox"
                                            checked={data.is_original_paint}
                                            onChange={(e) => update({ is_original_paint: e.target.checked })}
                                            className="hidden"
                                        />
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-[#103090] font-serif leading-none">{t("originalPaint")}</span>
                                            <span className="text-[9px] text-gray-400 font-sans mt-1">{translate("wizard.fields.original_paint_desc") || "Factory-applied paint"}</span>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <MinimalInputWrapper
                                    label={t("interiorColor")}
                                    required
                                    error={errors.interior_color}
                                >
                                    <ColorDropdown
                                        value={data.interior_color || ""}
                                        onChange={(v) => update({ interior_color: v })}
                                        minimal
                                    />
                                </MinimalInputWrapper>
                            </div>
                        </div>
                    </div>
                </div>
            </WizardCard>

            {/* Section 4: Narrative & Details */}
            <div className="grid grid-cols-1 gap-10">
                <WizardCard title={t("specialFeatures")}>
                    <div className="space-y-4">
                        <textarea
                            id="special_features"
                            value={String(data.special_features || "")}
                            onChange={(e) => update({ special_features: e.target.value })}
                            placeholder={translate("wizard.fields.special_features_placeholder")}
                            rows={5}
                            className="w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-5 text-base font-medium text-[#103090] placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#103090]/20 focus:bg-white transition-all resize-none font-sans leading-relaxed shadow-inner"
                        />
                    </div>
                </WizardCard>

                <WizardCard title={t("description")}>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{t("description")}</span>
                            <button
                                type="button"
                                onClick={() => {
                                    const make = data.make || (currentLang === 'ar' ? "السيارة" : "Vehicle")
                                    const model = data.model || ""
                                    const year = data.year || ""
                                    const mileage = data.mileage || "0"
                                    const cond = t(data.condition) || data.condition || ""
                                    const trans = data.transmission === 'Automatic'
                                        ? (currentLang === 'ar' ? 'أوتوماتيك' : 'Automatic')
                                        : (currentLang === 'ar' ? 'يدوي' : 'Manual')

                                    let pitch = ""

                                    switch (currentLang) {
                                        case 'ar':
                                            pitch = `سيارة ${make} ${model} ليست مجرد وسيلة نقل، بل هي رفيق درب يمنحك الراحة والأمان في كل رحلة. موديل ${year} وبحالة ${cond}، تم الحفاظ عليها بعناية فائقة لتقدم لك تجربة قيادة استثنائية وعقلانية. بمسافة مقطوعة تبلغ ${mileage} كم ومواصفات ${trans}، فهي تجمع بين الكفاءة والأناقة.\n`
                                            if (data.is_original_paint) pitch += `تتميز السيارة بصباغة الوكالة الأصلية مما يعكس قيمتها الحقيقية.\n`
                                            if (data.special_features) pitch += `إضافات مميزة: ${data.special_features}\n`
                                            pitch += `تواصلوا مع karkey اذا كنتم مهتمون بها.`
                                            break
                                        case 'fr':
                                            pitch = `Découvrez l'harmonie parfaite entre performance et élégance avec cette ${make} ${model} (${year}). Dans un état ${cond}, ce véhicule a été entretenu avec le plus grand soin, vous offrant une expérience de conduite exceptionnelle et rationnelle avec seulement ${mileage} KM au compteur. Plus qu'une voiture, c'est l'assurance d'un voyage serein avec sa boîte ${trans.toLowerCase()}.\n`
                                            if (data.is_original_paint) pitch += `Elle conserve sa peinture d'origine, gage de qualité et de soin.\n`
                                            if (data.special_features) pitch += `Options exclusives : ${data.special_features}\n`
                                            pitch += `Contactez Karkey si vous êtes intéressé.`
                                            break
                                        case 'es':
                                            pitch = `Descubra la combinación perfecta de fiabilidad y confort con este ${make} ${model} (${year}). En estado ${cond}, este vehículo ha sido mantenido con esmero, ofreciéndole una experiencia de conducción excepcional y racional con solo ${mileage} KM recorridos. Su transmisión ${trans.toLowerCase()} y su diseño la convierten en la opción ideal para su día a día.\n`
                                            if (data.is_original_paint) pitch += `Mantiene su pintura original de fábrica, demostrando un cuidado impecable.\n`
                                            if (data.special_features) pitch += `Características especiales: ${data.special_features}\n`
                                            pitch += `Contacte con Karkey si está interesado.`
                                            break
                                        default: // English
                                            pitch = `Experience the perfect blend of performance and reliability with this ${make} ${model} (${year}). In ${cond} condition, this vehicle has been meticulously cared for, offering you an exceptional and rational driving experience with only ${mileage} KM on the clock. Whether for daily commutes or weekend getaways, it promises comfort and peace of mind with its ${trans.toLowerCase()} transmission.\n`
                                            if (data.is_original_paint) pitch += `It features original factory paint, reflecting its true value and care.\n`
                                            if (data.special_features) pitch += `Additional highlights: ${data.special_features}\n`
                                            pitch += `Contact Karkey if you are interested.`
                                    }

                                    update({ description: pitch })
                                }}
                                className="text-[10px] font-black uppercase tracking-widest text-[#103090] hover:text-[#B8071C] flex items-center gap-1.5 transition-all bg-blue-50/50 hover:bg-blue-50 px-3 py-1.5 rounded-full border border-blue-100/50 active:scale-95"
                            >
                                <span className="text-base leading-none">✨</span>
                                {translate("wizard.magic_description")}
                            </button>
                        </div>

                        <div className="relative">
                            <textarea
                                id="description"
                                required
                                value={String(data.description || "")}
                                onChange={(e) => update({ description: e.target.value })}
                                placeholder={translate("wizard.fields.description_placeholder")}
                                rows={8}
                                className={`w-full bg-gray-50/50 border border-gray-100 rounded-2xl px-6 py-5 text-base font-medium text-[#103090] placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-500/5 focus:border-[#103090]/20 focus:bg-white transition-all resize-none font-sans leading-relaxed shadow-inner ${descriptionLength > 0 && descriptionLength < 20 ? "border-red-500 ring-red-500/5" : ""} ${(errors.description) ? "border-red-500" : ""}`}
                            />
                            <div className="absolute bottom-4 ltr:right-6 rtl:left-6 text-[10px] font-bold tracking-widest text-gray-400 pointer-events-none uppercase">
                                <span className={descriptionLength < 20 ? "text-red-500" : "text-[#103090]"}>
                                    {descriptionLength}
                                </span>
                                <span> / 20 MIN</span>
                            </div>
                        </div>
                        {(errors.description) && (
                            <p className="text-sm text-red-500 mt-2 font-sans font-medium">{errors.description}</p>
                        )}
                        {!errors.description && descriptionLength > 0 && descriptionLength < 20 && (
                            <p className="text-sm text-red-500 mt-2 font-sans font-medium">{translate("wizard.validation.min_20_chars")}</p>
                        )}
                    </div>
                </WizardCard>
            </div>
        </div>
    )
}
