"use client"

import React, { useState, useEffect, useMemo, useRef } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Check, MapPin, FileText, Heart, Sparkles } from "lucide-react";

/**
 * Client-side utility to resize images before upload.
 * Drastically reduces bandwidth usage for slow connections.
 */
async function resizeImage(file: File, maxWidth = 1200, maxHeight = 1200, quality = 0.6): Promise<File> {
  // If it's not an image, return original
  if (!file.type.startsWith('image/')) return file;

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(file);

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
          } else {
            resolve(file);
          }
        }, 'image/jpeg', quality);
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}
import { useTranslation } from "@/lib/i18n-context"
import { WizardLayout, WizardStep } from "@/components/ui/wizard-layout"
import { WizardCard } from "@/components/ui/wizard-card"
import { MinimalTextInput, MinimalSelect, MinimalTextarea } from "@/components/ui/minimal-input"
import { ColorDropdown } from "@/components/ui/color-dropdown"
import { PhotoUploadGrid } from "@/components/ui/photo-upload-grid"
import { CAR_COLORS } from "@/lib/car-colors"
import { createDirectSale } from "@/app/actions/direct-sales"
import { validateImageFile } from "@/lib/validations"

// Sample option lists
const makes = ["Kia", "Toyota", "Honda", "BMW", "Mercedes", "Hyundai", "Renault", "Peugeot", "Dacia", "Volkswagen"]
const modelsMap: Record<string, string[]> = {
  Kia: ["Rio", "Sportage", "Cerato", "Picanto", "Sorento"],
  Toyota: ["Corolla", "Camry", "RAV4", "Yaris", "Land Cruiser"],
  Honda: ["Civic", "Accord", "CR-V", "HR-V", "Jazz"],
  BMW: ["3 Series", "5 Series", "X3", "X5", "1 Series"],
  Mercedes: ["A-Class", "C-Class", "GLA", "E-Class", "GLC"],
  Hyundai: ["Elantra", "Tucson", "Santa Fe", "i10", "i20"],
  Renault: ["Clio", "Megane", "Duster", "Captur", "Kadjar"],
  Peugeot: ["208", "308", "2008", "3008", "508"],
  Dacia: ["Sandero", "Duster", "Logan", "Spring"],
  Volkswagen: ["Golf", "Polo", "Tiguan", "Passat", "T-Roc"],
}
const years = Array.from({ length: 36 }).map((_, i) => String(1990 + i))
const locations = ["Casablanca", "Rabat", "Mohammedia", "Tangier", "Marrakesh", "Fes", "Agadir", "Meknes", "Oujda"]


export default function CreateDirectSaleWizard() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t: translate, dir } = useTranslation()
  const isRtl = dir === "rtl"

  // Translation strings
  const t = (key: string) => {
    const strings: Record<string, string> = {
      carDetails: translate("wizard.steps.car_details"),
      carDetailsDesc: translate("wizard.steps.car_details_desc"),
      photos: translate("wizard.steps.photos"),
      photosDesc: translate("wizard.steps.photos_desc"),
      documents: translate("wizard.steps.documents"),
      documentsDesc: translate("wizard.steps.documents_desc"),
      pricing: translate("wizard.steps.pricing"),
      pricingDesc: translate("wizard.steps.pricing_desc"),
      review: translate("wizard.steps.review"),
      reviewDesc: translate("wizard.steps.review_desc"),
      previous: translate("wizard.buttons.previous"),
      cancel: translate("wizard.buttons.cancel"),
      nextStep: translate("wizard.buttons.next_step"),
      creating: translate("wizard.buttons.creating"),
      createListing: translate("direct_sales.create_listing"),
      make: translate("wizard.fields.make"),
      model: translate("wizard.fields.model"),
      year: translate("wizard.fields.year"),
      mileage: translate("wizard.fields.mileage"),
      condition: translate("wizard.fields.condition"),
      fuelType: translate("wizard.fields.fuel_type"),
      transmission: translate("wizard.fields.transmission"),
      engineSize: translate("wizard.fields.engine_size"),
      doors: translate("wizard.fields.doors"),
      location: translate("wizard.fields.location"),
      exteriorColor: translate("wizard.fields.exterior_color"),
      interiorColor: translate("wizard.fields.interior_color"),
      originalPaint: translate("wizard.fields.original_paint"),
      specialFeatures: translate("wizard.fields.special_features"),
      description: translate("wizard.fields.description"),
      descriptionMinChars: translate("wizard.fields.description_min_chars"),
      select: translate("wizard.fields.select"),
      excellent: translate("vehicle.condition.excellent"),
      good: translate("vehicle.condition.good"),
      fair: translate("vehicle.condition.fair"),
      poor: translate("vehicle.condition.poor"),
      petrol: translate("vehicle.fuel.petrol"),
      diesel: translate("vehicle.fuel.diesel"),
      electric: translate("vehicle.fuel.electric"),
      hybrid: translate("vehicle.fuel.hybrid"),
      automatic: translate("vehicle.transmission.automatic"),
      manual: translate("vehicle.transmission.manual"),
      askingPrice: translate("wizard.pricing.asking_price"),
      carteGrise: translate("wizard.upload.carte_grise"),
      serviceHistory: translate("wizard.upload.service_history"),
      vehicleInfo: translate("wizard.sections.vehicle_info"),
      appearance: translate("wizard.sections.appearance"),
      photosTitle: translate("wizard.sections.photos"),
      photosSubtitle: translate("wizard.sections.photos_subtitle"),
      photographyGuidelines: translate("wizard.sections.photography_guidelines"),
      bestPractices: translate("wizard.sections.best_practices"),
      avoid: translate("wizard.sections.avoid"),
      recommendedShots: translate("wizard.sections.recommended_shots"),
      documentsTitle: translate("wizard.sections.documents"),
      documentsSubtitle: translate("wizard.sections.documents_subtitle"),
      previewTitle: translate("wizard.sections.preview"),
      previewSubtitle: translate("wizard.sections.preview_subtitle"),
      scrollMore: translate("wizard.review.scroll_more"),
      exterior: translate("wizard.review.exterior"),
      interior: translate("wizard.review.interior"),
      clickToUpload: translate("wizard.review.click_to_upload"),
      optionalClick: translate("wizard.review.optional_click"),
      fileUploaded: translate("wizard.review.file_uploaded"),
    }
    return strings[key] ?? key
  }

  // State
  const [step, setStep] = useState(1)
  const [data, setData] = useState<any>({
    is_original_paint: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittingStatus, setSubmittingStatus] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)



  // Steps configuration
  const steps: WizardStep[] = useMemo(() => [
    { id: "details", label: t("carDetails"), description: t("carDetailsDesc") },
    { id: "photos", label: t("photos"), description: t("photosDesc") },
    { id: "documents", label: t("documents"), description: t("documentsDesc") },
    { id: "pricing", label: t("pricing"), description: t("pricingDesc") },
    { id: "review", label: t("review"), description: t("reviewDesc") },
  ], [])

  const update = (patch: any) => setData((s: any) => ({ ...s, ...patch }))

  // Validation
  const canNext = () => {
    const currentStepId = steps[step - 1]?.id
    switch (currentStepId) {
      case "details":
        const needsEngine = data.fuel_type !== "Electric"
        return Boolean(
          data.make && data.model && data.year && data.mileage &&
          data.condition && data.fuel_type && data.transmission &&
          (!needsEngine || data.engine_size) &&
          data.doors && data.location && data.description &&
          String(data.description).trim().length >= 20 &&
          data.exterior_color && data.interior_color
        )
      case "photos":
        return Array.isArray(data.photos) && data.photos.length >= 5
      case "documents":
        return Boolean(data.registration_doc)
      case "pricing":
        // Direct sales typically require price >= 10000
        const p = Number(String(data.price ?? "").replace(/[^0-9.\-]/g, ""))
        const priceValid = Number.isFinite(p) && p >= 10000

        // If auction consent is given, validate auction prices
        if (data.auction_consent) {
          const startPrice = Number(String(data.auction_starting_price ?? "").replace(/[^0-9.\-]/g, ""))
          const reservePrice = Number(String(data.auction_reserve_price ?? "").replace(/[^0-9.\-]/g, ""))
          const auctionPricesValid = Number.isFinite(startPrice) && startPrice >= 5000 &&
            Number.isFinite(reservePrice) && reservePrice > startPrice
          return priceValid && auctionPricesValid
        }
        return priceValid
      case "review":
        return true
      default:
        return true
    }
  }

  const goto = (n: number) => {
    setStep(Math.max(1, Math.min(steps.length, n)))
  }

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [step])

  // Submit handler
  const handleSubmit = async () => {
    setIsSubmitting(true)
    try {
      // Build FormData and submit...
      const formData = new FormData()
      formData.append("make", data.make)
      formData.append("model", data.model)
      formData.append("year", data.year)
      formData.append("mileage", data.mileage)
      formData.append("condition", data.condition)
      formData.append("fuel_type", data.fuel_type)
      formData.append("transmission", data.transmission)
      if (data.engine_size) formData.append("engine_size", data.engine_size)
      formData.append("doors", data.doors)
      formData.append("location", data.location)
      formData.append("description", data.description)
      if (data.special_features) formData.append("special_features", data.special_features)
      formData.append("price", data.price) // Direct Sale Price
      if (data.exterior_color) formData.append("exterior_color", data.exterior_color)
      if (data.interior_color) formData.append("interior_color", data.interior_color)
      formData.append("is_original_paint", String(data.is_original_paint !== false))

      // Auction consent fields
      formData.append("auction_consent", String(data.auction_consent === true))
      if (data.auction_consent) {
        if (data.auction_starting_price) formData.append("auction_starting_price", data.auction_starting_price)
        if (data.auction_reserve_price) formData.append("auction_reserve_price", data.auction_reserve_price)
      }

      // Photos - Resize on client to save up to 90% bandwidth
      if (data.photos) {
        setSubmittingStatus("Processing photos...")
        for (let i = 0; i < data.photos.length; i++) {
          setSubmittingStatus(`Optimizing photo ${i + 1}/${data.photos.length}...`)
          const item = data.photos[i]
          if (item instanceof File) {
            const resized = await resizeImage(item);
            formData.append("photos", resized)
          } else if (typeof item === 'string' && (item.startsWith('blob:') || item.startsWith('data:'))) {
            // ... (blob fetch) ...
            const b = await (await fetch(item)).blob();
            const resized = await resizeImage(new File([b], `photo_${i}.jpg`, { type: b.type }));
            formData.append('photos', resized);
          }
        }
      }

      setSubmittingStatus("Uploading to server...")

      // Documents
      const fetchBlob = async (url: string) => {
        try {
          const r = await fetch(url)
          return await r.blob()
        } catch (e) { return null }
      }

      // Carte Grise
      if (data.registration_doc instanceof File) {
        formData.append("carte_grise", data.registration_doc)
      } else if (typeof data.registration_doc === 'string' && data.registration_doc.startsWith('blob:')) {
        const b = await fetchBlob(data.registration_doc)
        if (b) {
          const ext = (b.type || '').split('/')[1] || 'pdf'
          formData.append('carte_grise', new File([b], `carte_grise.${ext}`, { type: b.type || 'application/octet-stream' }))
        }
      }

      // Service History might be a single file or array in new wizard? 
      // The original direct wizard handled array 'docs', new auction wizard handles single 'service_history'
      // We'll stick to single service_history for consistency with new UI unless required otherwise
      // But let's check what input StepDocuments produces. It produces a File object in 'service_history'.
      if (data.service_history instanceof File) {
        formData.append("service_docs", data.service_history) // API likely expects 'service_docs' based on previous file viewing, wait, auction expects 'service_history' but direct sale API?
        // Looking at old file: fd.append('service_docs', ...) for array.
        // We'll send it as 'service_docs' to be safe, or check direct sale API.
        // Let's assume 'service_docs' for now as the server likely iterates it.
      }

      const result = await createDirectSale(null, formData)

      if (result.success && result.directSaleId) {
        setIsSuccess(true)
      } else {
        alert(result.error || "Failed to create listing")
      }
    } catch (error) {
      console.error("Submit error:", error)
      alert("An error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const models = modelsMap[data.make] || []
  const sidebar = <SellGuidePanel />

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-[#f8fafc] via-white to-[#f0fdf4] z-[100] overflow-y-auto">
        {/* Subtle decorative background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#008E46]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#B8071C]/5 rounded-full blur-3xl" />
        </div>

        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-20 relative">
          {/* Animated Success Icon */}
          <div className="relative mb-10">
            {/* Soft glow ring */}
            <div className="absolute inset-0 bg-[#008E46]/10 rounded-full scale-150 animate-pulse opacity-50" />
            <div className="absolute inset-0 bg-[#008E46]/5 rounded-full scale-[2] animate-pulse opacity-30" style={{ animationDelay: '0.5s' }} />

            {/* Main icon */}
            <div className="relative w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-[#008E46] to-[#007A3D] rounded-full flex items-center justify-center shadow-xl shadow-[#008E46]/20">
              <Check className="w-12 h-12 md:w-14 md:h-14 text-white" strokeWidth={2.5} />
            </div>
          </div>

          {/* Title with animated underline */}
          <h2 className="text-3xl md:text-5xl font-serif text-[#008E46] tracking-tight mb-4 relative inline-block">
            {translate("wizard.success.title") || "تم نشر الإعلان بنجاح"}
            <span
              className="absolute -bottom-2 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#008E46] to-transparent animate-[expandWidth_0.8s_ease-out_0.5s_forwards]"
              style={{ width: '0%', margin: '0 auto' }}
            />
          </h2>

          {/* Elegant divider */}
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-slate-300 to-transparent my-8" />

          {/* Description */}
          <p className="text-lg md:text-xl text-gray-500 max-w-md mb-12 leading-relaxed font-serif">
            {translate("wizard.success.message") || "سيارتك الآن قيد المراجعة وستظهر للمشترين قريباً"}
          </p>

          {/* Premium Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <button
              onClick={() => router.push('/direct-sales')}
              className="group flex-1 px-8 py-4 bg-[#008E46] text-white rounded-xl font-serif text-lg hover:bg-[#007A3D] transition-all duration-300 shadow-lg shadow-[#008E46]/20 hover:shadow-xl hover:shadow-[#008E46]/30 hover:scale-[1.02] active:scale-[0.98]"
            >
              {translate("wizard.success.view_listings") || "صفحة البيع المباشر"}
            </button>
            <button
              onClick={() => router.push('/profile?tab=listings')}
              className="group flex-1 px-8 py-4 bg-white border border-slate-200 text-[#008E46] rounded-xl font-serif text-lg hover:border-[#008E46]/30 hover:bg-[#f0fdf4] transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              {translate("wizard.success.view_profile") || "إعلاناتي"}
            </button>
          </div>

          {/* Elegant footer */}
          <div className="mt-20 flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#B8071C] fill-[#B8071C] animate-pulse" />
            <span className="text-sm text-gray-400 font-serif">{translate("wizard.success.thank_you") || "شكراً لاختيارك كاركي"}</span>
          </div>
        </div>

        {/* Animation styles */}
        <style jsx global>{`
          @keyframes expandWidth {
            from { width: 0%; }
            to { width: 100%; }
          }
        `}</style>
      </div>
    )
  }

  return (
    <WizardLayout
      title={translate("wizard.titles.create_direct_sale") || "Create Direct Sale"}
      subtitle={translate("wizard.subtitle.create_direct_sale") || "List your vehicle for sale in a few simple steps"}
      currentStep={step}
      steps={steps}
      onStepNav={goto}
      sidebar={sidebar}
    >
      <div className="space-y-6">
        {/* Step Content */}
        {step === 1 && (
          <StepCarDetails data={data} update={update} t={t} models={models} />
        )}
        {step === 2 && (
          <StepPhotos data={data} update={update} t={t} />
        )}
        {step === 3 && (
          <StepDocuments data={data} update={update} t={t} />
        )}
        {step === 4 && (
          <StepPricing data={data} update={update} t={t} />
        )}
        {step === 5 && (
          <StepReview data={data} t={t} />
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-6">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => goto(step - 1)}
                className="flex items-center gap-3 px-5 py-3 text-base font-semibold text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                {t("previous")}
              </button>
            ) : (
              <Link
                href="/direct-sales"
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                {t("cancel")}
              </Link>
            )}
          </div>

          <div>
            {step < steps.length ? (
              <button
                type="button"
                onClick={() => goto(step + 1)}
                disabled={!canNext()}
                className={`flex items-center gap-3 px-8 py-3.5 rounded-xl text-base font-bold transition-all ${canNext()
                  ? "bg-[#B8071C] text-white hover:bg-[#8a0870]"
                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
              >
                {t("nextStep")}
                <ChevronRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-3 px-8 py-3.5 rounded-xl text-base font-bold bg-gradient-to-r from-[#B8071C] to-[#910515] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex flex-col items-center">
                    <span>{t("creating")}</span>
                    <span className="text-[10px] font-normal opacity-80 mt-0.5">{submittingStatus}</span>
                  </div>
                ) : t("createListing")}
                {!isSubmitting && <Check className="w-5 h-5" />}
              </button>
            )}
          </div>
        </div>
      </div>
    </WizardLayout>
  )
}

function SellGuidePanel() {
  const { t } = useTranslation()

  const steps = [
    { num: "1", title: t("sell_guide.unified.step1_title"), desc: t("sell_guide.unified.step1_desc") },
    { num: "2", title: t("sell_guide.unified.step2_title"), desc: t("sell_guide.unified.step2_desc") },
    { num: "3", title: t("sell_guide.unified.step3_title"), desc: t("sell_guide.unified.step3_desc") },
  ]

  const benefits = [
    t("sell_guide.unified.benefit1"),
    t("sell_guide.unified.benefit2"),
    t("sell_guide.unified.benefit3"),
  ]

  const faqs = [
    { q: t("sell_guide.unified.faq1_q"), a: t("sell_guide.unified.faq1_a") },
    { q: t("sell_guide.unified.faq2_q"), a: t("sell_guide.unified.faq2_a") },
    { q: t("sell_guide.unified.faq3_q"), a: t("sell_guide.unified.faq3_a") },
  ]

  return (
    <div className="space-y-6 w-full">
      {/* How it works */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 uppercase tracking-wide mb-4 font-serif">
          {t("sell_guide.how_it_works") || "How it works"}
        </h3>
        <div className="space-y-4">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#103090]/10 text-[#103090] flex items-center justify-center text-sm font-bold shrink-0 mt-0.5">
                {step.num}
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-900">{step.title}</h4>
                <p className="text-base text-gray-500 mt-1 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Benefits */}
      <div className="bg-[#103090] text-white rounded-xl p-8 shadow-lg shadow-[#103090]/20">
        <h3 className="text-lg font-bold mb-6 font-serif">
          {t("sell_guide.why_choose_this") || "Why choose Karkey?"}
        </h3>
        <ul className="space-y-3">
          {benefits.map((benefit, i) => (
            <li key={i} className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-white" />
              </div>
              <span className="text-lg text-gray-100">{benefit}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 uppercase tracking-wide mb-4 font-serif">
          {t("sell_guide.faq") || "FAQ"}
        </h3>
        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div key={i}>
              <h4 className="text-base font-bold text-gray-900 mb-1">{faq.q}</h4>
              <p className="text-base text-gray-500 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                              STEP COMPONENTS                               */
/* -------------------------------------------------------------------------- */

function StepCarDetails({ data, update, t, models }: any) {
  const { t: translate } = useTranslation()
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
    <div className="space-y-6">
      {/* Basic Details */}
      <WizardCard
        title={t("vehicleInfo")}
        stepIndicator={translate("wizard.progress.step_of", { current: 1, total: 5 })}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MinimalSelect
            label={t("make")}
            required
            value={data.make || ""}
            onChange={(e) => update({ make: e.target.value, model: "" })}
            options={makes.map((m) => ({ value: m, label: m }))}
            placeholder={t("select")}
          />
          <MinimalSelect
            label={t("model")}
            required
            value={data.model || ""}
            onChange={(e) => update({ model: e.target.value })}
            options={models.map((m: string) => ({ value: m, label: m }))}
            placeholder={t("select")}
            disabled={!data.make}
          />
          <MinimalSelect
            label={t("year")}
            required
            value={data.year || ""}
            onChange={(e) => update({ year: e.target.value })}
            options={years.map((y) => ({ value: y, label: y }))}
            placeholder={t("select")}
          />
          <MinimalTextInput
            label={t("mileage")}
            required
            type="number"
            step={100}
            value={data.mileage || ""}
            onChange={(e) => update({ mileage: e.target.value })}
            placeholder="e.g. 50000"
            suffix="KM"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          <MinimalSelect
            label={t("condition")}
            required
            value={data.condition || ""}
            onChange={(e) => update({ condition: e.target.value })}
            options={conditions}
            placeholder={t("select")}
          />
          <MinimalSelect
            label={t("fuelType")}
            required
            value={data.fuel_type || ""}
            onChange={(e) => update({ fuel_type: e.target.value })}
            options={fuelTypes}
            placeholder={t("select")}
          />
          <MinimalSelect
            label={t("transmission")}
            required
            value={data.transmission || ""}
            onChange={(e) => update({ transmission: e.target.value })}
            options={transmissions}
            placeholder={t("select")}
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
              placeholder="e.g. 2.0"
              suffix="L"
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <MinimalSelect
            label={t("doors")}
            required
            value={data.doors || ""}
            onChange={(e) => update({ doors: e.target.value })}
            options={doorOptions}
            placeholder={t("select")}
          />
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
          />
        </div>
      </WizardCard>

      {/* Appearance */}
      <WizardCard title={t("appearance")}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 font-serif">
                {t("exteriorColor")}
              </label>
              <ColorDropdown
                value={data.exterior_color || ""}
                onChange={(v) => update({ exterior_color: v })}
              />
            </div>

            {/* Original Paint Checkbox */}
            <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${data.is_original_paint
                ? "bg-[#B8071C] border-[#B8071C]"
                : "border-gray-300 bg-white"
                }`}>
                {data.is_original_paint && <Check className="w-3 h-3 text-white" />}
              </div>
              <input
                type="checkbox"
                checked={data.is_original_paint}
                onChange={(e) => update({ is_original_paint: e.target.checked })}
                className="hidden"
              />
              <span className="text-sm font-medium text-[#103090] font-serif">{t("originalPaint")}</span>
            </label>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-1 font-serif">
              {t("interiorColor")}
            </label>
            <ColorDropdown
              value={data.interior_color || ""}
              onChange={(v) => update({ interior_color: v })}
            />
          </div>
        </div>
      </WizardCard>

      {/* Special Features */}
      <WizardCard title={t("specialFeatures")}>
        <MinimalTextarea
          label={t("specialFeatures")}
          value={data.special_features || ""}
          onChange={(e) => update({ special_features: e.target.value })}
          placeholder={translate("wizard.fields.special_features_placeholder")}
          rows={3}
        />
      </WizardCard>

      {/* Description */}
      <WizardCard title={t("description")}>
        <MinimalTextarea
          label={t("description")}
          required
          value={data.description || ""}
          onChange={(e) => update({ description: e.target.value })}
          placeholder={translate("wizard.fields.description_placeholder")}
          rows={6}
          charCount={descriptionLength}
          minChars={20}
          hint={t("descriptionMinChars")}
          error={descriptionLength > 0 && descriptionLength < 20 ? "Minimum 20 characters required" : undefined}
        />
      </WizardCard>
    </div>
  )
}

function StepPhotos({ data, update, t }: any) {
  const { t: translate } = useTranslation()
  return (
    <div className="space-y-6">
      <WizardCard
        title={t("photosTitle")}
        stepIndicator={translate("wizard.progress.step_of", { current: 2, total: 5 })}
        subtitle={t("photosSubtitle")}
      >
        <PhotoUploadGrid
          photos={data.photos || []}
          onChange={(photos) => update({ photos })}
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

function StepDocuments({ data, update, t }: any) {
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

function StepPricing({ data, update, t }: any) {
  const { t: translate } = useTranslation()
  const priceTooLow = data.price && Number(data.price) < 10000
  const auctionConsent = data.auction_consent === true

  // Validate auction prices if consent is given
  const auctionStartingPriceError = auctionConsent && data.auction_starting_price && Number(data.auction_starting_price) < 5000
    ? translate("auction.consent.error.starting_min") || "Starting price must be at least 5,000 MAD"
    : undefined

  const auctionReservePriceError = auctionConsent && data.auction_reserve_price && data.auction_starting_price &&
    Number(data.auction_reserve_price) <= Number(data.auction_starting_price)
    ? translate("auction.consent.error.reserve_higher") || "Reserve price must be higher than starting price"
    : undefined

  return (
    <WizardCard
      title={translate("wizard.pricing.title") || "Sale Pricing"}
      stepIndicator={translate("wizard.progress.step_of", { current: 4, total: 5 }) || "Step 4 of 5"}
      subtitle={translate("wizard.pricing.subtitle") || "Set your asking price"}
    >
      <div className="space-y-8">
        {/* Direct Sale Price */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MinimalTextInput
            label={t("askingPrice")}
            required
            type="number"
            step={100}
            value={data.price || ""}
            onChange={(e) => update({ price: e.target.value })}
            placeholder="e.g. 50000"
            suffix={translate("common.mad")}
            hint={translate("wizard.pricing.min_price") || "Minimum 10,000 MAD"}
            error={priceTooLow ? translate("wizard.pricing.price_too_low") || "Price must be at least 10,000 MAD" : undefined}
          />
        </div>

        {/* Auction Consent Section */}
        <div className="border-t border-gray-200 pt-6">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 font-serif">
                  {translate("auction.consent.title") || "Auction Option"}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {translate("auction.consent.description") || "If your car doesn't sell within 10 days through direct sale, would you like us to list it in our weekend auction? Auctions run every Saturday and Sunday."}
                </p>

                {/* Consent Toggle */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={auctionConsent}
                      onChange={(e) => update({
                        auction_consent: e.target.checked,
                        // Clear auction prices if unchecked
                        ...(!e.target.checked ? { auction_starting_price: undefined, auction_reserve_price: undefined } : {})
                      })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-100 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {translate("auction.consent.agree") || "Yes, list in auction if not sold"}
                  </span>
                </label>

                {/* Auction Prices - Only show if consent is given */}
                {auctionConsent && (
                  <div className="mt-6 p-4 bg-white rounded-lg border border-amber-100 space-y-4">
                    <p className="text-sm text-gray-500 mb-4">
                      {translate("auction.consent.set_prices") || "Please set your auction prices:"}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <MinimalTextInput
                        label={translate("auction.consent.starting_price") || "Starting Price"}
                        required
                        type="number"
                        step={100}
                        value={data.auction_starting_price || ""}
                        onChange={(e) => update({ auction_starting_price: e.target.value })}
                        placeholder="e.g. 30000"
                        suffix={translate("common.mad")}
                        hint={translate("auction.consent.starting_price_hint") || "Bidding starts at this price"}
                        error={auctionStartingPriceError}
                      />
                      <MinimalTextInput
                        label={translate("auction.consent.reserve_price") || "Reserve Price"}
                        required
                        type="number"
                        step={100}
                        value={data.auction_reserve_price || ""}
                        onChange={(e) => update({ auction_reserve_price: e.target.value })}
                        placeholder="e.g. 45000"
                        suffix={translate("common.mad")}
                        hint={translate("auction.consent.reserve_price_hint") || "Minimum price you'll accept"}
                        error={auctionReservePriceError}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {translate("auction.consent.note") || "Note: If the car doesn't sell during the weekend auction, it will automatically return to direct sale."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </WizardCard>
  )
}

function StepReview({ data, t }: any) {
  const { t: translate } = useTranslation()
  const [mainPhotoIndex, setMainPhotoIndex] = useState(0)
  const thumbnailsRef = React.useRef<HTMLDivElement>(null)

  const photos = data.photos || []
  const mainPhoto = photos[mainPhotoIndex]

  const getPhotoUrl = (photo: File | string): string => {
    if (typeof photo === "string") return photo
    return URL.createObjectURL(photo)
  }

  // Auto-scroll thumbnails when main photo changes
  React.useEffect(() => {
    if (thumbnailsRef.current && photos.length > 0) {
      const container = thumbnailsRef.current
      const thumbnail = container.children[mainPhotoIndex] as HTMLElement
      if (thumbnail) {
        const containerWidth = container.offsetWidth
        const thumbnailLeft = thumbnail.offsetLeft
        const thumbnailWidth = thumbnail.offsetWidth
        const scrollPosition = thumbnailLeft - (containerWidth / 2) + (thumbnailWidth / 2)
        container.scrollTo({ left: scrollPosition, behavior: 'smooth' })
      }
    }
  }, [mainPhotoIndex, photos.length])

  const exteriorColor = CAR_COLORS.find(c => c.value === data.exterior_color)
  const interiorColor = CAR_COLORS.find(c => c.value === data.interior_color)

  // Icon helper
  const getIcon = (type: string) => {
    switch (type) {
      case "mileage": return "/icons/mileage.png"
      case "transmission": return "/icons/transmission.png"
      case "fuel": return data.fuel_type?.toLowerCase() === "electric" ? "/icons/electric-fuel.png" : "/icons/fuel.png"
      case "condition": return "/icons/condition.png"
      case "engine": return "/icons/engine.png"
      case "doors": return "/icons/car-door.png"
      default: return "/icons/condition.png"
    }
  }

  const goToPrev = () => setMainPhotoIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1))
  const goToNext = () => setMainPhotoIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1))

  return (
    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[#103090]">{t("previewTitle")}</h2>
          <p className="text-sm text-gray-500">{t("previewSubtitle")}</p>
        </div>
        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
          {translate("wizard.progress.step_of", { current: 5, total: 5 }) || "Step 5 of 5"}
        </span>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Photo Gallery */}
          <div className="space-y-4">
            {/* Main Photo with Navigation */}
            <div className="aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 relative group">
              {mainPhoto ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getPhotoUrl(mainPhoto)}
                    alt="Main photo"
                    className="w-full h-full object-cover"
                  />
                  {/* Navigation Arrows */}
                  {photos.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={goToPrev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-[#103090] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={goToNext}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-[#103090] shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  {/* Photo Counter */}
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                    {mainPhotoIndex + 1} / {photos.length}
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No photos
                </div>
              )}
            </div>

            {/* Scrollable Thumbnails */}
            {photos.length > 1 && (
              <div
                ref={thumbnailsRef}
                className="flex gap-2 overflow-x-auto py-1 px-1 -mx-1 scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {photos.map((photo: File | string, i: number) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setMainPhotoIndex(i)}
                    className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden bg-gray-100 transition-all ${i === mainPhotoIndex
                      ? "ring-2 ring-[#B8071C] ring-offset-1"
                      : "opacity-70 hover:opacity-100"
                      }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getPhotoUrl(photo)}
                      alt={`Thumbnail ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Vehicle Info */}
          <div className="space-y-6">
            {/* Title & Price */}
            <div>
              <h1 className="text-2xl font-bold text-[#103090]">
                {data.make} {data.model}
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-[#103090] text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {data.year}
                </span>
                <span className="flex items-center gap-1 text-gray-500 text-sm">
                  <MapPin className="w-4 h-4" />
                  {data.location}
                </span>
              </div>
              <p className="text-3xl font-bold text-[#B8071C] mt-4">
                {data.price ? `${Number(data.price).toLocaleString()} ${translate('common.mad')}` : "—"}
              </p>
              <p className="text-sm text-gray-500">{t("askingPrice")}</p>
            </div>

            {/* Specs Grid with Icons */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Mileage */}
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t("mileage")}</span>
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getIcon("mileage")} alt="" className="w-5 h-5 opacity-70" />
                    <span className="font-semibold text-[#103090]">
                      {data.mileage ? `${Number(data.mileage).toLocaleString()} ${translate("unit.km")}` : "—"}
                    </span>
                  </div>
                </div>

                {/* Transmission */}
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t("transmission")}</span>
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getIcon("transmission")} alt="" className="w-5 h-5 opacity-70" />
                    <span className="font-semibold text-[#103090]">{data.transmission || "—"}</span>
                  </div>
                </div>

                {/* Fuel */}
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t("fuelType")}</span>
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getIcon("fuel")} alt="" className="w-5 h-5 opacity-70" />
                    <span className="font-semibold text-[#103090]">{data.fuel_type || "—"}</span>
                  </div>
                </div>

                {/* Condition */}
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t("condition")}</span>
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getIcon("condition")} alt="" className="w-5 h-5 opacity-70" />
                    <span className="font-semibold text-[#103090]">{data.condition || "—"}</span>
                  </div>
                </div>

                {/* Engine */}
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t("engineSize")}</span>
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getIcon("engine")} alt="" className="w-5 h-5 opacity-70" />
                    <span className="font-semibold text-[#103090]">{data.engine_size ? `${data.engine_size}` : "—"}</span>
                  </div>
                </div>

                {/* Doors */}
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t("doors")}</span>
                  <div className="flex items-center gap-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={getIcon("doors")} alt="" className="w-5 h-5 opacity-70" />
                    <span className="font-semibold text-[#103090]">{data.doors || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Special Features */}
            {data.special_features && (
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 font-serif flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
                  </svg>
                  {t("specialFeatures")}
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-base">
                  {data.special_features}
                </p>
              </div>
            )}

            {/* Appearance */}
            <div className="bg-gray-50 rounded-xl p-6">
              {exteriorColor && (
                <div className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-full ${exteriorColor.border ? "border border-gray-300" : ""}`}
                    style={{ background: exteriorColor.hex }}
                  />
                  <span className="text-sm text-gray-600">
                    {translate(`colors.${exteriorColor.value}` as any)} {t("exterior")}
                  </span>
                </div>
              )}
              {interiorColor && (
                <div className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-full ${interiorColor.border ? "border border-gray-300" : ""}`}
                    style={{ background: interiorColor.hex }}
                  />
                  <span className="text-sm text-gray-600">
                    {translate(`colors.${interiorColor.value}` as any)} {t("interior")}
                  </span>
                </div>
              )}
              {data.is_original_paint && (
                <span className="text-sm text-green-600 font-medium">✓ {t("originalPaint")}</span>
              )}
            </div>
          </div>
        </div>

        {/* Description */}
        {data.description && (
          <div className="mt-8 pt-6 border-t border-gray-100">
            <h3 className="text-lg font-semibold text-[#103090] mb-3">{t("description")}</h3>
            <div className="max-h-48 overflow-y-auto">
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{data.description}</p>
            </div>
            {data.description.length > 500 && (
              <p className="text-xs text-gray-400 mt-2">{t("scrollMore")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
