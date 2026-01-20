// TypeScript Types and Interfaces for Database Models

// ============================================
// User Types
// ============================================

export type UserType = "individual" | "dealer" | "company"
export type VerificationStatus = "pending" | "approved" | "rejected"

export interface User {
  id: number
  username: string
  email: string
  password: string // Hashed
  phone_number: string
  prenom: string
  nom: string
  user_type: UserType
  created_at: Date
  updated_at: Date
}

// User data without sensitive information (for API responses)
export interface SafeUser {
  id: number
  username: string
  email: string
  phone_number: string
  prenom: string
  nom: string
  user_type: UserType
  created_at: Date
  updated_at: Date
}

// User registration data
export interface UserRegistrationData {
  username: string
  email: string
  password: string
  phone_number: string
  prenom: string
  nom: string
  user_type: UserType
}



// ============================================
// Vehicle, Photos, Auction & Bids
// ============================================

export interface Vehicle {
  id: number
  user_id: number
  make: string
  model: string
  year: number
  mileage: number
  transmission: "manual" | "automatic"
  fuel_type: "gasoline" | "diesel" | "electric" | "hybrid" | "petrol" // tolerate both spellings in DB
  vehicle_condition: "excellent" | "good" | "fair" | "poor" | "new" | "used"
  location: string
  description: string
  carte_grise_url: string
  service_history_url?: string | null
  verification_status: VerificationStatus
  rejected_reason?: string | null
  created_at: Date
  updated_at: Date
}

export interface VehiclePhoto {
  id: number
  vehicle_id: number
  photo_url: string
  position_order: number
  created_at: Date
}

export type AuctionStatus =
  | "pending"
  | "active"
  | "completed"
  | "cancelled"

export interface Auction {
  id: number
  vehicle_id: number
  user_id: number
  starting_price: number
  reserve_price?: number | null
  current_bid?: number | null
  duration_days: number
  start_date: string
  end_date: string
  status: AuctionStatus
  deposit_paid: boolean
  deposit_amount: number
  winner_id?: number | null
  created_at: Date
  updated_at: Date
}

export interface Bid {
  id: number
  auction_id: number
  user_id: number
  amount: number
  created_at: Date
}

// ============================================
// Plans, Subscriptions, Billing
// ============================================

export interface Plan {
  id: number
  name: string
  price: number
  currency: string
  duration_days: number
  bid_limit?: number | null
  status: "active" | "inactive"
  created_at: Date
  updated_at: Date
}

export interface Subscription {
  id: number
  user_id: number
  plan_id: number
  status: "pending" | "active" | "expired" | "cancelled"
  start_date?: string | null
  end_date?: string | null
  created_at: Date
  updated_at: Date
}

export interface Deposit {
  id: number
  user_id: number
  auction_id?: number | null
  amount: number
  status: "pending" | "paid" | "refunded" | "failed"
  method: "card" | "bank" | "cash" | "other"
  reference?: string | null
  created_at: Date
  updated_at: Date
}

export interface Invoice {
  id: number
  user_id: number
  subscription_id?: number | null
  deposit_id?: number | null
  total: number
  status: "draft" | "issued" | "paid" | "void" | "refunded"
  issued_at: string
  due_at?: string | null
  paid_at?: string | null
  created_at: Date
  updated_at: Date
}

export interface Payment {
  id: number
  user_id: number
  invoice_id?: number | null
  amount: number
  status: "pending" | "succeeded" | "failed" | "refunded"
  provider: "stripe" | "paypal" | "transfer" | "cash" | "other"
  provider_ref?: string | null
  created_at: Date
  updated_at: Date
}

// ============================================
// Notifications, Requests, Inspections, Blacklist
// ============================================

export interface Notification {
  id: number
  user_id: number
  title: string
  message: string
  type: "success" | "error" | "info" | "warning"
  is_read: boolean
  created_at: Date
}

export interface RequestItem {
  id: number
  user_id: number
  type: "verification" | "auction" | "withdrawal" | "support" | "other"
  status: "pending" | "approved" | "rejected" | "cancelled" | "in_progress"
  payload?: Record<string, unknown>
  admin_notes?: string | null
  created_at: Date
  updated_at: Date
}

export interface Inspection {
  id: number
  vehicle_id: number
  requested_by: number
  scheduled_at?: string | null
  status: "pending" | "scheduled" | "completed" | "cancelled"
  report_url?: string | null
  created_at: Date
  updated_at: Date
}

export interface Blacklist {
  id: number
  user_id: number
  admin_id?: number | null
  reason?: string | null
  expires_at?: string | null
  created_at: Date
  updated_at: Date
}
