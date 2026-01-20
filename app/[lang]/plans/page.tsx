"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { useTranslation, useLanguage } from "@/lib/i18n-context"
import { useRouter } from "next/navigation"

// Smooth animated number component
function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  const [displayValue, setDisplayValue] = useState(value)
  const prevValue = useRef(value)

  useEffect(() => {
    const from = prevValue.current
    const to = value
    prevValue.current = value

    if (from === to) return

    const duration = 400 // ms
    const startTime = performance.now()
    const diff = to - from

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease-out cubic for smooth deceleration
      const eased = 1 - Math.pow(1 - progress, 3)

      const current = Math.round(from + diff * eased)
      setDisplayValue(current)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    requestAnimationFrame(animate)
  }, [value])

  return <span className={className}>{displayValue}</span>
}

interface Plan {
  id: number
  name: string
  name_ar?: string | null
  name_fr?: string | null
  name_es?: string | null
  price: number
  currency: string
  duration_days: number
  bid_limit?: number | null
  status: string
  features?: string[]
  features_ar?: string[] | null
  features_fr?: string[] | null
  features_es?: string[] | null
  popular?: boolean
  description?: string
  description_ar?: string | null
  description_fr?: string | null
  description_es?: string | null
}

const samplePlans: Plan[] = [
  {
    id: 1,
    name: 'Starter',
    price: 199,
    currency: 'DH',
    duration_days: 30,
    description: 'Perfect for individual sellers looking to list a few vehicles each month',
    features: [
      'Up to 3 active auctions',
      'Up to 5 Karkey Cars listings',
      'Standard listing visibility',
      'Basic auction analytics',
      'Email support',
      '7-day listing duration',
      'Photo uploads (up to 10 per listing)',
    ],
    status: 'active'
  },
  {
    id: 2,
    name: 'Accelerator',
    price: 299,
    currency: 'DH',
    duration_days: 30,
    description: 'Ideal for dealers and frequent sellers who need more visibility and tools',
    features: [
      'Up to 15 active auctions',
      'Up to 30 Karkey Cars listings',
      'Priority listing placement',
      'Advanced auction analytics',
      'Priority email & chat support',
      '14-day listing duration',
      'Photo uploads (up to 25 per listing)',
      'Featured badge on listings',
      'Bid notifications & alerts',
    ],
    popular: true,
    status: 'active'
  },
  {
    id: 3,
    name: 'Prestige',
    price: 399,
    currency: 'DH',
    duration_days: 30,
    description: 'For large dealerships and professionals who need unlimited access and premium support',
    features: [
      'Unlimited active auctions',
      'Unlimited Karkey Cars listings',
      'Top placement in search results',
      'Full analytics dashboard',
      'Dedicated account manager',
      '30-day listing duration',
      'Unlimited photo uploads',
      'Verified dealer badge',
      'Early access to new features',
      'Custom branding options',
    ],
    status: 'active'
  }
]

export default function PlansPage() {
  const { t } = useTranslation()
  const language = useLanguage()
  const router = useRouter()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState<number | null>(null)
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual')

  // Helper to get translated field based on current language
  const getTranslatedField = <T,>(
    plan: Plan,
    field: 'name' | 'description' | 'features',
    fallback: T
  ): T => {
    if (language === 'en') return fallback
    const translatedField = `${field}_${language}` as keyof Plan
    const translatedValue = plan[translatedField]
    if (translatedValue !== null && translatedValue !== undefined) {
      return translatedValue as T
    }
    return fallback
  }

  useEffect(() => {
    let mounted = true
    fetch('/api/plans')
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return
        if (data?.success && Array.isArray(data.plans)) setPlans(data.plans)
      })
      .catch((e) => {
        console.error('Failed to load plans', e)
      })
      .finally(() => { if (mounted) setLoading(false) })

    return () => { mounted = false }
  }, [])

  const visiblePlans = useMemo(() => (plans.length ? plans : samplePlans), [plans])

  async function handleSubscribe(planId: number) {
    if (submitting) return
    setSubmitting(planId)
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ plan_id: planId, billing_period: billing }),
      })
      const data = await res.json()
      if (!res.ok || !data?.success) {
        alert('Failed to create subscription: ' + (data?.error || res.statusText))
      } else {
        // Handle payment redirect with strict security
        const redirectToPayment = (paymentUrl: unknown): void => {
          // Only process if we have a string
          if (typeof paymentUrl !== 'string' || !paymentUrl) {
            window.location.href = '/profile/subscription'
            return
          }

          // Strict URL validation - reject anything suspicious
          let parsed: URL
          try {
            parsed = new URL(paymentUrl)
          } catch {
            window.location.href = '/profile/subscription'
            return
          }

          // Only allow HTTPS (except localhost for dev)
          if (parsed.protocol !== 'https:' && parsed.hostname !== 'localhost') {
            window.location.href = '/profile/subscription'
            return
          }

          // Whitelist of allowed payment domains
          const ALLOWED_DOMAINS = [
            'karkey.ma',
            'stripe.com',
            'paypal.com'
          ] as const

          // Check domain with strict matching
          const isAllowed = ALLOWED_DOMAINS.some(domain =>
            parsed.hostname === domain ||
            parsed.hostname === `www.${domain}` ||
            parsed.hostname === `checkout.${domain}` ||
            (domain !== 'karkey.ma' && parsed.hostname.endsWith(`.${domain}`))
          ) || parsed.hostname === 'localhost'

          if (!isAllowed) {
            console.error('Blocked redirect to untrusted domain:', parsed.hostname)
            window.location.href = '/profile/subscription'
            return
          }

          // Safe to redirect - domain is whitelisted
          // We use parsed.toString() to ensure we're using the sanitized URL object
          router.push(parsed.toString())
        }

        if (data.paymentUrl) {
          redirectToPayment(data.paymentUrl)
        } else {
          // Fallback: go to profile subscription page
          window.location.href = '/profile/subscription'
        }
      }
    } catch (err) {
      console.error(err)
      alert('Error creating subscription')
    } finally {
      setSubmitting(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] pt-6 pb-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-[#B8071C] mb-3">{t("pricing.title")}</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto mt-2">
            {t("pricing.subtitle")}
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center items-center gap-4 mb-12">
          <div className="inline-flex items-center bg-white rounded-full p-1 shadow-md border border-gray-200">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billing === 'monthly'
                ? 'bg-[#B8071C] text-white shadow-sm'
                : 'text-gray-600 hover:text-[#B8071C]'
                }`}
            >
              {t("pricing.monthly")}
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${billing === 'annual'
                ? 'bg-[#B8071C] text-white shadow-sm'
                : 'text-gray-600 hover:text-[#B8071C]'
                }`}
            >
              {t("pricing.annual")}
            </button>
          </div>

          {/* Reserve space for the Save badge so toggle doesn't shift layout. Use opacity/transform for smooth show/hide. */}
          <span className={`inline-flex items-center px-3 py-1 rounded-full bg-[#B8071C]/10 text-[#B8071C] text-sm font-medium transition-all duration-300 ease-out min-w-[92px] justify-center ${billing === 'annual' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-0 pointer-events-none'}`}>
            {billing === 'annual' ? t("pricing.save_27") : ''}
          </span>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">{t("pricing.loading")}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {visiblePlans.map((plan, index) => {
              const isPopular = !!plan.popular
              const badgeLabel = isPopular ? t("pricing.badge.popular") : index === 0 ? t("pricing.badge.active") : t("pricing.badge.recommended")
              const monthlyPrice = plan.price
              const annualPrice = Math.round(monthlyPrice * 12 * 0.73)
              const displayPrice = billing === 'annual' ? annualPrice : monthlyPrice
              const oldPrice = billing === 'annual' ? monthlyPrice * 12 : null

              // Get translated values from database, fallback to static translations or original values
              const planKey = plan.name.toLowerCase()
              const isStandardPlan = ["starter", "accelerator", "prestige"].includes(planKey)

              // Priority: DB translations > static translations > original value
              const dbName = getTranslatedField(plan, 'name', plan.name)
              const dbDesc = getTranslatedField(plan, 'description', plan.description || '')
              const dbFeatures = getTranslatedField(plan, 'features', plan.features || [])

              // Use DB translations if available, otherwise fall back to static translations for standard plans
              const hasDbTranslation = language !== 'en' && (
                plan[`name_${language}` as keyof Plan] ||
                plan[`description_${language}` as keyof Plan] ||
                plan[`features_${language}` as keyof Plan]
              )

              const displayName = hasDbTranslation
                ? dbName
                : (isStandardPlan ? t(`pricing.${planKey}.name` as any) : plan.name)

              const displayDesc = hasDbTranslation
                ? dbDesc
                : (isStandardPlan ? t(`pricing.${planKey}.description` as any) : (plan.description || 'Perfect for your needs'))

              const displayFeatures = hasDbTranslation
                ? dbFeatures
                : (isStandardPlan
                  ? (plan.features || []).map((_, idx) => t(`pricing.${planKey}.feature_${idx + 1}` as any))
                  : (plan.features || []))

              return (
                <div
                  key={plan.id}
                  className={`relative rounded-3xl overflow-hidden transition-transform duration-300 will-change-transform ${isPopular
                    ? 'transform md:scale-[1.02] shadow-xl hover:scale-[1.025]'
                    : 'shadow-lg bg-white hover:shadow-xl hover:-translate-y-1 hover:scale-[1.006]'
                    }`}
                  style={
                    isPopular
                      ? {
                        background: `
                            linear-gradient(#fff, #fff) padding-box,
                            repeating-linear-gradient(
                              45deg,
                              #DEB735 0px,
                              #DEB735 10px,
                              #F5E6C3 10px,
                              #F5E6C3 20px
                            ) border-box
                          `,
                        border: '6px solid transparent',
                        borderRadius: '1.5rem',
                      }
                      : undefined
                  }
                >
                  {/* Badge for every card (Popular / Active / Recommended) */}
                  <div className="absolute top-6 ltr:right-6 rtl:left-6 z-10">
                    <div className={`${isPopular ? 'bg-gradient-to-r from-[#DEB735] to-[#B4941F] text-white' : 'bg-white text-[#B8071C] border border-gray-200'} text-xs font-semibold px-3 py-1.5 rounded-full shadow`}>
                      {badgeLabel}
                    </div>
                  </div>

                  <div className="p-8 h-full flex flex-col">
                    <div className="mb-6">
                      <div className="flex items-start justify-between mb-2 ltr:pr-16 rtl:pl-16">
                        <h3 className={`text-2xl font-bold font-serif ${isPopular ? 'text-[#103090]' : 'text-[#103090]'}`}>
                          {displayName}
                        </h3>
                        {/* keep badges handled above */}
                      </div>
                      <p className={`text-sm ${isPopular ? 'text-gray-700' : 'text-gray-600'} leading-relaxed ltr:pr-12 rtl:pl-12`}>
                        {displayDesc}
                      </p>
                    </div>

                    <div className="mb-8">
                      <div className="flex items-end gap-3 mb-1">
                        {oldPrice && (
                          <span className="text-sm line-through text-gray-400">{oldPrice} DH</span>
                        )}

                        <div className="flex items-end gap-2">
                          <AnimatedNumber value={displayPrice} className={`text-5xl font-serif font-extrabold ${isPopular ? 'text-[#103090]' : 'text-[#103090]'}`} />
                          <span className={`text-2xl font-semibold ${isPopular ? 'text-[#103090]' : 'text-[#103090]'}`}>DH</span>
                          <span className={`text-sm text-gray-500 mb-1 transition-opacity duration-300 ${billing === 'annual' ? 'opacity-100' : 'opacity-100'}`}>{billing === 'annual' ? t("pricing.per_year") : t("pricing.per_month")}</span>
                        </div>
                      </div>

                      <p className={`text-sm ${isPopular ? 'text-gray-600' : 'text-gray-500'}`}>
                        {billing === 'annual' ? Math.round(annualPrice / 12) : monthlyPrice} DH {t("pricing.billing_period", { period: billing === 'annual' ? t("pricing.annual") : t("pricing.monthly") })}
                      </p>
                    </div>

                    <ul className="space-y-3 mb-8 flex-grow">
                      {displayFeatures.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${isPopular ? 'bg-[#DEB735]' : 'bg-[#B8071C]'}`}>
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </span>
                          <span className={`text-sm ${isPopular ? 'text-gray-700' : 'text-gray-700'}`}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <div className="space-y-3">
                      <Button
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={submitting === plan.id}
                        className={`w-full py-5 rounded-full text-base font-semibold transition-all ${isPopular ? 'bg-white text-[#DEB735] border-2 border-[#DEB735] hover:bg-[#fff9e6]' : 'bg-[#B8071C] text-white hover:bg-[#910515]'}`}
                      >
                        {submitting === plan.id ? t("pricing.processing") : t("pricing.subscribe")}
                      </Button>
                      {/* Removed Cancel secondary button per design request */}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
