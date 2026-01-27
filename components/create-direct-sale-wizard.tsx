"use client"

import React, { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Check, Heart } from "lucide-react";

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
import { createDirectSale } from "@/app/actions/direct-sales"

// Imported Steps
import { StepCarDetails } from "@/components/wizard/steps/step-car-details"
import { StepPhotos } from "@/components/wizard/steps/step-photos"
import { StepDocuments } from "@/components/wizard/steps/step-documents"
import { StepPricing } from "@/components/wizard/steps/step-pricing"
import { StepReview } from "@/components/wizard/steps/step-review"
import { useLocalStorage } from "@/hooks/use-local-storage"

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
  const searchParams = useSearchParams()
  const router = useRouter()
  const { t: translate, dir } = useTranslation()

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
    }
    return strings[key] ?? key
  }





  // State with Auto-Save
  const [step, setStep, clearStep] = useLocalStorage("direct_sale_wizard_step", 1)
  const [data, setData, clearData] = useLocalStorage<any>("direct_sale_wizard_data", {
    is_original_paint: true,
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittingStatus, setSubmittingStatus] = useState("")
  const [isSuccess, setIsSuccess] = useState(false)

  // Clear drafts on unmount if successful? No, keep it until explicit success.

  // Hydration fix: Ensure we only render the loaded state on client
  const [isHydrated, setIsHydrated] = useState(false)
  useEffect(() => {
    setIsHydrated(true)
  }, [])

  // ... (rest of logic) ...


  // Keep a ref to the latest photos to access in async loops (avoid stale closures)
  const latestPhotosRef = React.useRef(data.photos || [])
  useEffect(() => {
    latestPhotosRef.current = data.photos || []
  }, [data.photos])

  // PROMISE-BASED UPLOAD TRACKING
  const uploadPromisesRef = React.useRef(new Map<string, Promise<any>>())

  // Centralized Upload Handler (Passed to StepPhotos)
  const handleUpload = async (file: File, id: string) => {
    // 1. Initial State Update (Pending -> Uploading)
    setData((prev: any) => {
      const photos = prev.photos || []
      return {
        ...prev,
        photos: photos.map((p: any) => p.id === id ? { ...p, status: 'uploading' } : p)
      }
    })

    // 2. Create Promise
    const uploadPromise = (async () => {
      try {
        // Compress
        const { compressImage } = await import("@/lib/client-image-compression")
        let uploadFile = file
        let isProcessed = false

        try {
          uploadFile = await compressImage(file, { maxWidth: 1024, maxHeight: 1024, quality: 0.6, watermark: true })
          isProcessed = true
        } catch (e) { console.warn("Compress failed", e) }

        // Upload
        const fd = new FormData()
        fd.append("file", uploadFile)

        const headers: Record<string, string> = {}
        if (isProcessed) {
          headers['x-optimized'] = '1'
        }

        const res = await fetch("/api/upload", {
          method: "POST",
          body: fd,
          headers
        })

        if (!res.ok) throw new Error("Status " + res.status)
        const json = await res.json()
        if (!json.success) throw new Error(json.error)

        // Success Update
        setData((prev: any) => {
          const photos = prev.photos || []
          return {
            ...prev,
            photos: photos.map((p: any) => p.id === id ? {
              ...p,
              status: 'completed',
              url: json.url,
              blurhash: json.blurhash,
              file: undefined
            } : p)
          }
        })

        // Cleanup promise from map after success
        uploadPromisesRef.current.delete(id)
        return json

      } catch (err) {
        console.error("Upload failed", id, err)
        setData((prev: any) => {
          const photos = prev.photos || []
          return {
            ...prev,
            photos: photos.map((p: any) => p.id === id ? { ...p, status: 'error', error: "Failed" } : p)
          }
        })
        uploadPromisesRef.current.delete(id)
        throw err
      }
    })()

    // 3. Track Promise
    uploadPromisesRef.current.set(id, uploadPromise)
    return uploadPromise
  }

  // Document Upload Handler
  const handleDocumentUpload = async (file: File, type: 'carte_grise' | 'service_history') => {
    const id = `${type}-${Date.now()}`
    // We don't need detailed status tracking in UI for docs for now (just "Uploaded"), 
    // but we track promise for submission blocking.

    const uploadPromise = (async () => {
      try {
        // Docs don't need aggressive compression usually (PDF/Images)
        // But if image, we should compress and WATERMARK
        let uploadFile = file
        let isProcessed = false

        if (file.type.startsWith('image/')) {
          const { compressImage } = await import("@/lib/client-image-compression")
          try {
            // Explicitly request watermarking
            uploadFile = await compressImage(file, {
              maxWidth: 1600,
              maxHeight: 1600,
              quality: 0.8,
              watermark: true
            })
            isProcessed = true
          } catch (e) { console.warn("Doc compress failed", e) }
        }

        const fd = new FormData()
        fd.append("file", uploadFile)

        const headers: Record<string, string> = {}
        // Only tell server to skip processing if we actually processed it on client
        if (isProcessed) {
          headers['x-optimized'] = '1'
        }

        const res = await fetch("/api/upload", {
          method: "POST",
          body: fd,
          headers
        })

        if (!res.ok) throw new Error("Status " + res.status)
        const json = await res.json()
        if (!json.success) throw new Error(json.error)

        // Update Data with URL
        setData((prev: any) => {
          return {
            ...prev,
            [type === 'carte_grise' ? 'carte_grise_url' : 'service_doc_urls']:
              type === 'carte_grise' ? json.url : [...(prev.service_doc_urls || []), json.url]
          }
        })

        // Cleanup
        uploadPromisesRef.current.delete(id)
        return json

      } catch (err) {
        console.error("Doc upload failed", type, err)
        uploadPromisesRef.current.delete(id)
        throw err
      }
    })()

    uploadPromisesRef.current.set(id, uploadPromise)
    return uploadPromise
  }

  // Ref to block updates after submission
  const isFinishedRef = React.useRef(false)

  // Steps configuration
  const steps: WizardStep[] = useMemo(() => [
    { id: "details", label: t("carDetails"), description: t("carDetailsDesc") },
    { id: "photos", label: t("photos"), description: t("photosDesc") },
    { id: "documents", label: t("documents"), description: t("documentsDesc") },
    { id: "pricing", label: t("pricing"), description: t("pricingDesc") },
    { id: "review", label: t("review"), description: t("reviewDesc") },
  ], [])

  const update = React.useCallback((patch: any) => {
    // Prevent updates if we already finished/submitted
    if (isFinishedRef.current) return
    setData((s: any) => ({ ...s, ...patch }))
  }, [])

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
        // DO NOT allow next if photos are still uploading or failed
        const hasBlockers = data.photos?.some((p: any) => p.status === 'uploading' || p.status === 'error')
        return Array.isArray(data.photos) && data.photos.length >= 5 && !hasBlockers
      case "documents":
        return Boolean(data.registration_doc)
      case "pricing":
        // ... existing validation ...
        const p = Number(String(data.price ?? "").replace(/[^0-9.\-]/g, ""))
        const priceValid = Number.isFinite(p) && p >= 10000
        if (data.auction_consent) {
          const startPrice = Number(String(data.auction_starting_price ?? "").replace(/[^0-9.\-]/g, ""))
          const reservePrice = Number(String(data.auction_reserve_price ?? "").replace(/[^0-9.\-]/g, ""))
          return priceValid && Number.isFinite(startPrice) && startPrice >= 5000 &&
            Number.isFinite(reservePrice) && reservePrice > startPrice
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

      // Photos - Optimistic Upload
      // Wait for all upload promises to resolve/reject
      if (data.photos && Array.isArray(data.photos) && data.photos.length > 0) {
        setSubmittingStatus("Finalizing... This may take a moment.")

        const promises = Array.from(uploadPromisesRef.current.values())
        if (promises.length > 0) {
          try {
            // Wait for all active uploads to finish (success or fail)
            await Promise.allSettled(promises)
          } catch (e) {
            console.error("Some uploads failed", e)
          }
        }

        // Final Verify: Ensure every photo in state is 'completed'
        // We re-check the ref or data directly.
        const finalPhotos = data.photos || []
        const hasErrors = finalPhotos.some((p: any) => p.status !== 'completed')
        if (hasErrors) {
          throw new Error("One or more photos failed to upload. Please fix them and try again.")
        }

        // Final check of status for Photos
        const completedPhotos = latestPhotosRef.current.filter((p: any) => p.status === 'completed' && p.url)
        if (completedPhotos.length < 5) {
          alert("Not enough photos uploaded (Minimum 5). Please retry failed uploads.")
          setIsSubmitting(false)
          return
        }

        finalPhotos.forEach((p: any) => {
          formData.append("photo_urls", p.url)
          if (p.blurhash) formData.append("photo_blurhashes", p.blurhash)
        })
      }

      setSubmittingStatus("Saving to database...")

      // Optimistic Documents
      if (data.carte_grise_url) {
        formData.append("carte_grise_url", data.carte_grise_url)
      } else if (data.registration_doc instanceof File) {
        // Fallback if promise failed but file is there (should rarely happen if blocked by promise wait above)
        formData.append("carte_grise", data.registration_doc)
      }

      if (data.service_doc_urls && Array.isArray(data.service_doc_urls)) {
        data.service_doc_urls.forEach((url: string) => formData.append("service_doc_urls", url))
      } else if (data.service_history instanceof File) {
        formData.append("service_docs", data.service_history)
      }

      const result = await createDirectSale(null, formData)

      if (result.success && result.directSaleId) {
        // Block further updates
        isFinishedRef.current = true

        // Force Clear LocalStorage immediately
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("direct_sale_wizard_step")
          window.localStorage.removeItem("direct_sale_wizard_data")
        }

        // Hooks clear
        clearStep()
        clearData()

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
          <StepPhotos data={data} update={update} t={t} onUpload={handleUpload} />
        )}
        {step === 3 && (
          <StepDocuments data={data} update={update} t={t} onUpload={handleDocumentUpload} />
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
                <ChevronLeft className="w-5 h-5 ltr:block rtl:hidden" />
                <ChevronRight className="w-5 h-5 ltr:hidden rtl:block" />
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
                <ChevronRight className="w-5 h-5 ltr:block rtl:hidden" />
                <ChevronLeft className="w-5 h-5 ltr:hidden rtl:block" />
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
