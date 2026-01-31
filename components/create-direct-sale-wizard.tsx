"use client"

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Check, Heart } from "lucide-react";
import { useTranslation } from "@/lib/i18n-context"
import { WizardLayout, WizardStep } from "@/components/ui/wizard-layout"
import { createDirectSale } from "@/app/actions/direct-sales"
import logger from "@/lib/logger"
import { useToast } from "@/hooks/use-toast"

// Imported Steps
import { StepCarDetails } from "@/components/wizard/steps/step-car-details"
import { StepPhotos } from "@/components/wizard/steps/step-photos"
import { StepDocuments } from "@/components/wizard/steps/step-documents"
import { StepPricing } from "@/components/wizard/steps/step-pricing"
import { StepReview } from "@/components/wizard/steps/step-review"
import { useLocalStorage } from "@/hooks/use-local-storage"
import { useImageUpload } from "@/hooks/use-image-upload"
import {
  CarDetailsSchema,
  PhotosSchema,
  DocumentsSchema,
  PricingSchema,
  DirectSaleSubmissionSchema
} from "@/lib/validation/direct-sale"
import { z } from "zod"

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

export default function CreateDirectSaleWizard() {
  const router = useRouter()
  const { t: translate } = useTranslation()
  const { toast } = useToast()

  // State with Auto-Save
  const [step, setStep, clearStep] = useLocalStorage("direct_sale_wizard_step", 1)
  const [data, setData, clearData] = useLocalStorage<any>("direct_sale_wizard_data", {
    is_original_paint: true,
  })

  // Validation Errors State
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Constants
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittingStatus, setSubmittingStatus] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)
  const isFinishedRef = useRef(false)

  // Use the new Upload Hook
  const { upload, waitForAll, hasActiveUploads } = useImageUpload({ watermark: true })
  const { upload: uploadDoc } = useImageUpload({ watermark: true, quality: 0.8 })

  // Translation strings helper
  const t = useCallback((key: string) => {
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
      "unit.km": translate("unit.km"),
      "unit.liter": translate("unit.liter"),
      "wizard.placeholders.mileage": translate("wizard.placeholders.mileage"),
      "wizard.placeholders.engine_size": translate("wizard.placeholders.engine_size"),
      scrollMore: translate("wizard.review.scroll_more"),
      exterior: translate("wizard.review.exterior"),
      interior: translate("wizard.review.interior"),
      clickToUpload: translate("wizard.review.click_to_upload"),
      optionalClick: translate("wizard.review.optional_click"),
      fileUploaded: translate("wizard.review.file_uploaded"),
      "wizard.titles.create_direct_sale": translate("wizard.titles.create_direct_sale"),
      "wizard.subtitle.create_direct_sale": translate("wizard.subtitle.create_direct_sale"),
    }
    return strings[key] ?? key
  }, [translate])

  // Upload Handlers
  const handleUpload = async (file: File, id: string) => {
    setData((prev: any) => ({
      ...prev,
      photos: (prev.photos || []).map((p: any) => p.id === id ? { ...p, status: 'uploading' } : p)
    }))

    try {
      await upload(file, id, (id, patch) => {
        setData((prev: any) => ({
          ...prev,
          photos: (prev.photos || []).map((p: any) => p.id === id ? { ...p, ...patch } : p)
        }))
      })
    } catch (e) {
      // Error handled via callback
    }
  }

  const handleDocumentUpload = async (file: File, type: 'carte_grise' | 'service_history') => {
    const id = `${type}-${Date.now()}`
    try {
      await uploadDoc(file, id, (id, patch) => {
        if (patch.status === 'completed' && patch.url) {
          setData((prev: any) => ({
            ...prev,
            [type === 'carte_grise' ? 'carte_grise_url' : 'service_doc_urls']:
              type === 'carte_grise' ? patch.url : [...(prev.service_doc_urls || []), patch.url]
          }))
        }
      })
    } catch (e) {
      logger.error("Doc Upload Error", e)
      toast({
        title: translate("wizard.upload.error") || "Upload failed",
        description: String(e),
        variant: "destructive"
      })
    }
  }

  // Steps
  const steps: WizardStep[] = useMemo(() => [
    { id: "details", label: t("carDetails"), description: t("carDetailsDesc") },
    { id: "photos", label: t("photos"), description: t("photosDesc") },
    { id: "documents", label: t("documents"), description: t("documentsDesc") },
    { id: "pricing", label: t("pricing"), description: t("pricingDesc") },
    { id: "review", label: t("review"), description: t("reviewDesc") },
  ], [t])

  const update = React.useCallback((patch: any) => {
    if (isFinishedRef.current) return
    setData((s: any) => ({ ...s, ...patch }))
    if (Object.keys(errors).length > 0) {
      const newErrors = { ...errors }
      Object.keys(patch).forEach(k => delete newErrors[k])
      setErrors(newErrors)
    }
  }, [errors, setData])

  // Validation
  const validateStep = (currentStep: number): boolean => {
    try {
      setErrors({})
      const stepId = steps[currentStep - 1]?.id

      if (stepId === "details") {
        CarDetailsSchema.parse(data)
      } else if (stepId === "photos") {
        if (hasActiveUploads()) return false
        PhotosSchema.parse({ photos: data.photos })
      } else if (stepId === "documents") {
        DocumentsSchema.parse(data)
      } else if (stepId === "pricing") {
        PricingSchema.parse(data)
      }
      return true
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {}
        error.issues.forEach(issue => {
          newErrors[issue.path[0].toString()] = issue.message
        })
        setErrors(newErrors)
      }
      return false
    }
  }

  const goto = (n: number) => {
    if (n > step) {
      if (!validateStep(step)) return
    }
    setStep(Math.max(1, Math.min(steps.length, n)))
  }

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [step])

  // Submit
  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmittingStatus("Validating...")

    try {
      if (hasActiveUploads()) {
        setSubmittingStatus("Finishing uploads...")
        await waitForAll()
      }

      const result = DirectSaleSubmissionSchema.safeParse(data)
      if (!result.success) {
        const firstIssue = result.error.issues[0]
        toast({
          title: "Validation Error",
          description: firstIssue.message,
          variant: "destructive"
        })
        setIsSubmitting(false)
        return
      }

      setSubmittingStatus("Saving...")

      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'photos' || key === 'service_doc_urls') return
        if (value !== undefined && value !== null) {
          formData.append(key, String(value))
        }
      })

      if (data.photos) {
        data.photos.forEach((p: any) => {
          formData.append("photo_urls", p.url)
          if (p.blurhash) formData.append("photo_blurhashes", p.blurhash)
        })
      }
      if (data.service_doc_urls) {
        data.service_doc_urls.forEach((url: string) => formData.append("service_doc_urls", url))
      }

      const res = await createDirectSale(null, formData)

      if (res.success && res.directSaleId) {
        isFinishedRef.current = true
        clearStep()
        clearData()
        setIsSuccess(true)
      } else {
        toast({
          title: "Error",
          description: res.error || "Failed to create listing",
          variant: "destructive"
        })
      }

    } catch (error) {
      logger.error("Submit error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const models = modelsMap[data.make] || []

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-gradient-to-b from-[#f8fafc] via-white to-[#f0fdf4] z-[100] overflow-y-auto">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#008E46]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#B8071C]/5 rounded-full blur-3xl" />
        </div>

        <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-20 relative">
          <div className="relative mb-10">
            <div className="absolute inset-0 bg-[#008E46]/10 rounded-full scale-150 animate-pulse opacity-50" />
            <div className="relative w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-[#008E46] to-[#007A3D] rounded-full flex items-center justify-center shadow-xl shadow-[#008E46]/20">
              <Check className="w-12 h-12 md:w-14 md:h-14 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h2 className="text-3xl md:text-5xl font-serif text-[#008E46] tracking-tight mb-4 relative inline-block">
            {translate("wizard.success.title") || "Success!"}
          </h2>
          <p className="text-lg md:text-xl text-gray-500 max-w-md mb-12 leading-relaxed font-serif">
            {translate("wizard.success.message") || "Your listing is under review."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            <button onClick={() => router.push('/direct-sales')} className="group flex-1 px-8 py-4 bg-[#008E46] text-white rounded-xl font-serif text-lg hover:bg-[#007A3D] shadow-lg shadow-[#008E46]/20 transition-all">
              {translate("wizard.success.view_listings") || "View Listings"}
            </button>
          </div>

          <div className="mt-20 flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#B8071C] fill-[#B8071C] animate-pulse" />
            <span className="text-sm text-gray-400 font-serif">{translate("wizard.success.thank_you") || "Thank you for choosing Karkey"}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <WizardLayout
      title={t("wizard.titles.create_direct_sale")}
      subtitle={t("wizard.subtitle.create_direct_sale")}
      currentStep={step}
      steps={steps}
      onStepNav={goto}
    >
      <div className="space-y-6">
        {step === 1 && <StepCarDetails data={data} update={update} t={t} models={models} errors={errors} />}
        {step === 2 && <StepPhotos data={data} update={update} t={t} onUpload={handleUpload} errors={errors} />}
        {step === 3 && <StepDocuments data={data} update={update} t={t} onUpload={handleDocumentUpload} errors={errors} />}
        {step === 4 && <StepPricing data={data} update={update} t={t} errors={errors} />}
        {step === 5 && <StepReview data={data} t={t} />}

        <div className="flex items-center justify-between pt-12">
          <div>{step > 1 ? (
            <button
              type="button"
              onClick={() => goto(step - 1)}
              className="group flex items-center gap-2.5 px-6 py-3.5 text-base font-bold text-gray-500 hover:text-[#103090] transition-all bg-white border border-gray-100 rounded-2xl hover:border-[#103090]/20 hover:shadow-lg hover:shadow-blue-900/5 active:scale-95"
            >
              <ChevronLeft className="w-5 h-5 ltr:block rtl:hidden transition-transform group-hover:-translate-x-1" />
              <ChevronRight className="w-5 h-5 ltr:hidden rtl:block transition-transform group-hover:translate-x-1" />
              <span className="font-serif uppercase tracking-widest text-xs">{t("previous")}</span>
            </button>
          ) : (
            <Link
              href="/direct-sales"
              className="flex items-center gap-2 px-6 py-3.5 text-xs font-black uppercase tracking-[0.2em] text-gray-400 hover:text-[#B8071C] transition-colors"
            >
              {t("cancel")}
            </Link>
          )}</div>

          <div>{step < steps.length ? (
            <button
              type="button"
              onClick={() => goto(step + 1)}
              disabled={
                hasActiveUploads() ||
                (step === 2 && (data.photos || []).filter((p: any) => p.status === 'completed').length < 5)
              }
              className={`group flex items-center gap-3 px-10 py-4 rounded-2xl text-base font-bold transition-all shadow-xl ${!hasActiveUploads() && !(step === 2 && (data.photos || []).filter((p: any) => p.status === 'completed').length < 5)
                ? "bg-[#103090] text-white hover:bg-[#153eb8] shadow-blue-900/20 hover:shadow-blue-900/30 active:scale-95"
                : "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none"
                }`}
            >
              <span className="font-serif uppercase tracking-widest text-sm">{t("nextStep")}</span>
              <ChevronRight className="w-5 h-5 ltr:block rtl:hidden transition-transform group-hover:translate-x-1" />
              <ChevronLeft className="w-5 h-5 ltr:hidden rtl:block transition-transform group-hover:-translate-x-1" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-3 px-12 py-4 rounded-2xl text-base font-bold bg-gradient-to-r from-[#B8071C] to-[#910515] text-white hover:opacity-90 shadow-xl shadow-red-900/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="flex flex-col items-center">
                  <span className="font-serif uppercase tracking-widest text-sm">{t("creating")}</span>
                  <span className="text-[10px] opacity-80 font-sans tracking-normal">{submittingStatus}</span>
                </div>
              ) : (
                <span className="font-serif uppercase tracking-widest text-sm">{t("createListing")}</span>
              )}
              {!isSubmitting && <Check className="w-5 h-5" />}
            </button>
          )}</div>
        </div>
      </div>
    </WizardLayout >
  )
}

