// Form Validation Utilities
// Contains regex patterns and validation functions for user input

import { parsePhoneNumberFromString, CountryCode, isValidPhoneNumber } from "libphonenumber-js"

// ============================================
// Validation Regex Patterns
// ============================================

export const VALIDATION_PATTERNS = {
  // Username: 3-20 characters, letters, numbers, underscores only
  username: /^[a-zA-Z0-9_]{3,20}$/,

  // Email: standard email format
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Password: 8-30 characters, at least one uppercase and one number
  password: /^(?=.*[A-Z])(?=.*\d).{8,30}$/,

  // Moroccan phone: +212 followed by 5/6/7 and 8 more digits
  phone: /^\+212[5-7][0-9]{8}$/,

  // Moroccan CIN: 1-4 letters followed by 1-8 numbers
  cin: /^[A-Z]{1,4}[0-9]{1,8}$/,
}

// ============================================
// Validation Functions
// ============================================

export interface ValidationResult {
  isValid: boolean
  error?: string
}

export function validateUsername(username: string): ValidationResult {
  if (!username) {
    return { isValid: false, error: "validation.username_required" }
  }
  if (!VALIDATION_PATTERNS.username.test(username)) {
    return {
      isValid: false,
      error: "validation.username_format",
    }
  }
  return { isValid: true }
}

export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: false, error: "validation.email_required" }
  }
  if (!VALIDATION_PATTERNS.email.test(email)) {
    return { isValid: false, error: "validation.email_invalid" }
  }
  return { isValid: true }
}

export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { isValid: false, error: "validation.password_required" }
  }
  if (password.length < 8 || password.length > 30) {
    return { isValid: false, error: "validation.password_length" }
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: "validation.password_uppercase" }
  }
  if (!/\d/.test(password)) {
    return { isValid: false, error: "validation.password_number" }
  }
  return { isValid: true }
}

export function validatePhone(phone: string): ValidationResult {
  if (!phone) {
    return { isValid: false, error: "validation.phone_required" }
  }
  if (!VALIDATION_PATTERNS.phone.test(phone)) {
    return {
      isValid: false,
      error: "validation.phone_format",
    }
  }
  return { isValid: true }
}

// International phone validation using libphonenumber-js - Best Practice ✅
// Supports all countries with proper E.164 format
// Used by: Facebook, Uber, Airbnb, Avito...
export function validatePhoneInternational(phone: string, countryCode?: string): ValidationResult {
  if (!phone) {
    return { isValid: false, error: "validation.phone_required" }
  }
  
  try {
    // Parse the phone number with optional country hint
    const phoneNumber = parsePhoneNumberFromString(phone, countryCode as CountryCode | undefined)
    
    if (!phoneNumber) {
      return { isValid: false, error: "validation.phone_format" }
    }
    
    // Use libphonenumber's built-in validation
    if (!phoneNumber.isValid()) {
      return { isValid: false, error: "validation.phone_format" }
    }
    
    return { isValid: true }
  } catch {
    return { isValid: false, error: "validation.phone_format" }
  }
}

// Normalize phone number to E.164 format (e.g., +212612345678)
// Ready for SMS / WhatsApp integration
export function normalizePhoneNumber(phone: string, countryCode?: string): string | null {
  try {
    const phoneNumber = parsePhoneNumberFromString(phone, countryCode as CountryCode | undefined)
    if (phoneNumber && phoneNumber.isValid()) {
      return phoneNumber.number // Returns E.164 format
    }
    return null
  } catch {
    return null
  }
}

export function validateCIN(cin: string): ValidationResult {
  if (!cin) {
    return { isValid: false, error: "validation.cin_required" }
  }
  if (!VALIDATION_PATTERNS.cin.test(cin)) {
    return {
      isValid: false,
      error: "validation.cin_format",
    }
  }
  return { isValid: true }
}

export function validateUserType(userType: string): ValidationResult {
  const validTypes = ["individual", "dealer", "company"]
  if (!userType) {
    return { isValid: false, error: "validation.user_type_required" }
  }
  if (!validTypes.includes(userType)) {
    return { isValid: false, error: "validation.user_type_invalid" }
  }
  return { isValid: true }
}

export function validateName(name: string, fieldLabel = "Name"): ValidationResult {
  const trimmed = (name || "").trim()
  if (!trimmed) {
    return { isValid: false, error: "validation.name_required" }
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: "validation.name_min_length" }
  }
  if (trimmed.length > 50) {
    return { isValid: false, error: "validation.name_max_length" }
  }
  // Allow international letters (Arabic/Latin), spaces, apostrophes and hyphens.
  // Must start with a letter.
  const pattern = /^[\p{L}][\p{L}\p{M}\s'-]*$/u
  if (!pattern.test(trimmed)) {
    return { isValid: false, error: "validation.name_invalid_chars" }
  }
  return { isValid: true }
}

function parseStrictISODate(dateStr: string): { ok: boolean; date?: Date } {
  // Expect YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return { ok: false }
  const [y, m, d] = dateStr.split("-").map((v) => Number(v))
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return { ok: false }
  if (m < 1 || m > 12) return { ok: false }
  if (d < 1 || d > 31) return { ok: false }

  // Use UTC to avoid timezone day-shifts.
  const dt = new Date(Date.UTC(y, m - 1, d))
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return { ok: false }
  }
  return { ok: true, date: dt }
}

function getAgeYears(dobUtc: Date, nowUtc: Date): number {
  let age = nowUtc.getUTCFullYear() - dobUtc.getUTCFullYear()
  const m = nowUtc.getUTCMonth() - dobUtc.getUTCMonth()
  if (m < 0 || (m === 0 && nowUtc.getUTCDate() < dobUtc.getUTCDate())) {
    age--
  }
  return age
}

export function validateBirthDate(dateStr: string, minAgeYears = 18): ValidationResult {
  if (!dateStr) {
    return { isValid: false, error: "validation.dob_required" }
  }

  const parsed = parseStrictISODate(dateStr)
  if (!parsed.ok || !parsed.date) {
    return { isValid: false, error: "validation.dob_invalid" }
  }

  const dob = parsed.date
  const now = new Date()
  const nowUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))

  const year = dob.getUTCFullYear()
  const currentYear = nowUtc.getUTCFullYear()

  // Reject unrealistic years (e.g., 1888) and future dates.
  if (year < 1900) {
    return { isValid: false, error: "validation.dob_unrealistic" }
  }
  if (year > currentYear) {
    return { isValid: false, error: "validation.dob_future" }
  }
  if (dob.getTime() > nowUtc.getTime()) {
    return { isValid: false, error: "validation.dob_future" }
  }

  const age = getAgeYears(dob, nowUtc)
  if (age < minAgeYears) {
    return { isValid: false, error: "validation.dob_min_age" }
  }
  if (age > 120) {
    return { isValid: false, error: "validation.dob_unrealistic" }
  }

  return { isValid: true }
}

// ============================================
// File Validation
// ============================================

export function validateImageFile(file: File, allowWebP = false): ValidationResult {
  const maxSize = 20 * 1024 * 1024 // 20MB
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png"]
  if (allowWebP) {
    allowedTypes.push("image/webp")
  }

  if (!file) {
    return { isValid: false, error: "validation.image_required" }
  }

  if (!allowedTypes.includes(file.type)) {
    return { isValid: false, error: "validation.image_type_invalid" }
  }

  if (file.size > maxSize) {
    return { isValid: false, error: "validation.file_too_large" }
  }

  return { isValid: true }
}

// ============================================
// Vehicle & Auction Validation
// ============================================

export interface VehicleFormData {
  make: string
  model: string
  year: number
  mileage: number
  transmission: "manual" | "automatic"
  fuel_type: "gasoline" | "diesel" | "electric" | "hybrid"
  vehicle_condition: "excellent" | "good" | "fair" | "poor"
  location: string
  description: string
  carte_grise_url: string
  service_history_url?: string
}

export interface AuctionFormData extends VehicleFormData {
  starting_price: number
  reserve_price?: number
  duration_days: number
  deposit_amount?: number
  photos: string[] // URLs of uploaded photos
}

export function validateVehicleData(data: Partial<VehicleFormData>): ValidationResult {
  // Make validation
  if (!data.make || data.make.trim().length === 0) {
    return { isValid: false, error: "Vehicle make is required" }
  }
  if (data.make.length > 100) {
    return { isValid: false, error: "Make must be less than 100 characters" }
  }

  // Model validation
  if (!data.model || data.model.trim().length === 0) {
    return { isValid: false, error: "Vehicle model is required" }
  }
  if (data.model.length > 100) {
    return { isValid: false, error: "Model must be less than 100 characters" }
  }

  // Year validation
  const currentYear = new Date().getFullYear()
  if (!data.year) {
    return { isValid: false, error: "Vehicle year is required" }
  }
  if (data.year < 1900 || data.year > currentYear + 1) {
    return { isValid: false, error: `Year must be between 1900 and ${currentYear + 1}` }
  }

  // Mileage validation
  if (data.mileage === undefined || data.mileage === null) {
    return { isValid: false, error: "Mileage is required" }
  }
  if (data.mileage < 0) {
    return { isValid: false, error: "Mileage cannot be negative" }
  }
  if (data.mileage > 10000000) {
    return { isValid: false, error: "Mileage value is unrealistic" }
  }

  // Transmission validation
  const validTransmissions = ["manual", "automatic"]
  if (!data.transmission) {
    return { isValid: false, error: "Transmission type is required" }
  }
  if (!validTransmissions.includes(data.transmission)) {
    return { isValid: false, error: "Transmission must be manual or automatic" }
  }

  // Fuel type validation
  const validFuelTypes = ["gasoline", "diesel", "electric", "hybrid"]
  if (!data.fuel_type) {
    return { isValid: false, error: "Fuel type is required" }
  }
  if (!validFuelTypes.includes(data.fuel_type)) {
    return { isValid: false, error: "Fuel type must be gasoline, diesel, electric, or hybrid" }
  }

  // Vehicle condition validation
  const validConditions = ["excellent", "good", "fair", "poor"]
  if (!data.vehicle_condition) {
    return { isValid: false, error: "Vehicle condition is required" }
  }
  if (!validConditions.includes(data.vehicle_condition)) {
    return { isValid: false, error: "Vehicle condition must be excellent, good, fair, or poor" }
  }

  // Location validation
  if (!data.location || data.location.trim().length === 0) {
    return { isValid: false, error: "Location is required" }
  }
  if (data.location.length > 255) {
    return { isValid: false, error: "Location must be less than 255 characters" }
  }

  // Description validation
  if (!data.description || data.description.trim().length === 0) {
    return { isValid: false, error: "Description is required" }
  }
  if (data.description.length < 20) {
    return { isValid: false, error: "Description must be at least 20 characters" }
  }
  if (data.description.length > 5000) {
    return { isValid: false, error: "Description must be less than 5000 characters" }
  }

  // Carte grise (registration document) validation
  if (!data.carte_grise_url || data.carte_grise_url.trim().length === 0) {
    return { isValid: false, error: "Carte grise (registration document) is required" }
  }

  return { isValid: true }
}

export function validateAuctionData(data: Partial<AuctionFormData>): ValidationResult {
  // First validate all vehicle data
  const vehicleValidation = validateVehicleData(data)
  if (!vehicleValidation.isValid) {
    return vehicleValidation
  }

  // Starting price validation
  if (!data.starting_price || data.starting_price <= 0) {
    return { isValid: false, error: "Starting price must be greater than 0" }
  }
  if (data.starting_price > 100000000) {
    return { isValid: false, error: "Starting price is unrealistic" }
  }

  // Reserve price validation (required and must be greater than starting price)
  if (data.reserve_price === undefined || data.reserve_price === null || data.reserve_price <= 0) {
    return { isValid: false, error: "Reserve price is required" }
  }
  if (data.reserve_price <= data.starting_price) {
    return { isValid: false, error: "Reserve price must be greater than starting price" }
  }

  // Duration validation
  if (!data.duration_days) {
    return { isValid: false, error: "Auction duration is required" }
  }
  if (data.duration_days < 1 || data.duration_days > 30) {
    return { isValid: false, error: "Auction duration must be between 1 and 30 days" }
  }

  // Photos validation (5-10 photos required)
  if (!data.photos || data.photos.length === 0) {
    return { isValid: false, error: "At least 5 vehicle photos are required" }
  }
  if (data.photos.length < 5) {
    return { isValid: false, error: "Minimum 5 photos required" }
  }
  if (data.photos.length > 10) {
    return { isValid: false, error: "Maximum 10 photos allowed" }
  }

  return { isValid: true }
}
