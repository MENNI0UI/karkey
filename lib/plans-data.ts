/**
 * Shared plans data - used as fallback in both server (API) and client components
 * This eliminates duplication and ensures consistency
 */

export interface Plan {
  id: number
  name: string
  name_ar?: string | null
  name_fr?: string | null
  name_es?: string | null
  price: number
  currency: string
  duration_days: number
  bid_limit: number | null
  description: string | null
  description_ar?: string | null
  description_fr?: string | null
  description_es?: string | null
  features: string[]
  features_ar?: string[] | null
  features_fr?: string[] | null
  features_es?: string[] | null
  popular: boolean
  priority: number
  status: 'active' | 'inactive'
}

export const fallbackPlans: Plan[] = [
  {
    id: 1,
    name: 'Starter',
    price: 199,
    currency: 'DH',
    duration_days: 30,
    bid_limit: 3,
    description: 'Perfect for individual sellers looking to list a few vehicles each month',
    features: [
      'Up to 3 active auctions',
      'Up to 5 showroom listings',
      'Standard listing visibility',
      'Basic auction analytics',
      'Email support',
      '7-day listing duration',
      'Photo uploads (up to 10 per listing)',
    ],
    popular: false,
    priority: 1,
    status: 'active'
  },
  {
    id: 2,
    name: 'Accelerator',
    price: 299,
    currency: 'DH',
    duration_days: 30,
    bid_limit: 15,
    description: 'Ideal for dealers and frequent sellers who need more visibility and tools',
    features: [
      'Up to 15 active auctions',
      'Up to 30 showroom listings',
      'Priority listing placement',
      'Advanced auction analytics',
      'Priority email & chat support',
      '14-day listing duration',
      'Photo uploads (up to 25 per listing)',
      'Featured badge on listings',
      'Bid notifications & alerts',
    ],
    popular: true,
    priority: 2,
    status: 'active'
  },
  {
    id: 3,
    name: 'Prestige',
    price: 399,
    currency: 'DH',
    duration_days: 30,
    bid_limit: null,
    description: 'For large dealerships and professionals who need unlimited access and premium support',
    features: [
      'Unlimited active auctions',
      'Unlimited showroom listings',
      'Top placement in search results',
      'Full analytics dashboard',
      'Dedicated account manager',
      '30-day listing duration',
      'Unlimited photo uploads',
      'Verified dealer badge',
      'Early access to new features',
      'Custom branding options',
    ],
    popular: false,
    priority: 3,
    status: 'active'
  }
]

/**
 * Get annual price (20% discount)
 */
export function getAnnualPrice(monthlyPrice: number): number {
  return Math.round(monthlyPrice * 12 * 0.8)
}

/**
 * Get monthly equivalent when paying annually
 */
export function getMonthlyFromAnnual(annualPrice: number): number {
  return Math.round(annualPrice / 12)
}
