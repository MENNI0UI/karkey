/**
 * Phone number utilities using libphonenumber-js
 * Best Practice for phone validation ✅
 * 
 * Features:
 * - Server-side validation (never trust frontend alone!)
 * - E.164 format normalization
 * - Country-specific validation
 * - Ready for SMS/WhatsApp integration
 */

import { parsePhoneNumberFromString, isValidPhoneNumber, CountryCode } from "libphonenumber-js"

export interface PhoneValidationResult {
  isValid: boolean
  normalized?: string // E.164 format: +2126XXXXXXXX
  country?: string
  error?: string
}

/**
 * Validate and normalize phone number - SERVER SIDE
 * Always use this in server actions/API routes
 * 
 * @param phone - The phone number to validate
 * @param defaultCountry - Default country code (e.g., "MA" for Morocco)
 * @returns Validation result with normalized number
 * 
 * @example
 * const result = validateAndNormalizePhone("+212612345678", "MA")
 * if (result.isValid) {
 *   // Save result.normalized to database
 *   // result.normalized = "+212612345678"
 * }
 */
export function validateAndNormalizePhone(
  phone: string,
  defaultCountry: CountryCode = "MA"
): PhoneValidationResult {
  if (!phone || phone.trim() === "") {
    return {
      isValid: false,
      error: "Phone number is required"
    }
  }

  try {
    // Parse the phone number
    const phoneNumber = parsePhoneNumberFromString(phone, defaultCountry)

    if (!phoneNumber) {
      return {
        isValid: false,
        error: "Invalid phone number format"
      }
    }

    // Check if valid
    if (!phoneNumber.isValid()) {
      return {
        isValid: false,
        error: `Invalid phone number for ${phoneNumber.country || defaultCountry}`
      }
    }

    // Return normalized E.164 format
    return {
      isValid: true,
      normalized: phoneNumber.number, // E.164 format: +2126XXXXXXXX
      country: phoneNumber.country
    }
  } catch {
    return {
      isValid: false,
      error: "Could not parse phone number"
    }
  }
}

/**
 * Quick validation check without normalization
 * 
 * @param phone - The phone number to validate
 * @param country - Country code (e.g., "MA", "FR", "US")
 */
export function isPhoneValid(phone: string, country?: CountryCode): boolean {
  try {
    return isValidPhoneNumber(phone, country)
  } catch {
    return false
  }
}

/**
 * Extract country code from phone number
 * 
 * @param phone - The phone number in E.164 format
 * @returns Country code or undefined
 */
export function getPhoneCountry(phone: string): CountryCode | undefined {
  try {
    const phoneNumber = parsePhoneNumberFromString(phone)
    return phoneNumber?.country
  } catch {
    return undefined
  }
}

/**
 * Format phone number for display
 * 
 * @param phone - The phone number in E.164 format
 * @returns Formatted phone number (e.g., "+212 6 12 34 56 78")
 */
export function formatPhoneForDisplay(phone: string): string {
  try {
    const phoneNumber = parsePhoneNumberFromString(phone)
    return phoneNumber?.formatInternational() || phone
  } catch {
    return phone
  }
}

/**
 * Get national format (without country code)
 * 
 * @param phone - The phone number in E.164 format
 * @returns National format (e.g., "06 12 34 56 78")
 */
export function formatPhoneNational(phone: string): string {
  try {
    const phoneNumber = parsePhoneNumberFromString(phone)
    return phoneNumber?.formatNational() || phone
  } catch {
    return phone
  }
}

// Common country codes for quick reference
export const SUPPORTED_COUNTRIES: CountryCode[] = [
  "MA", // Morocco
  "DZ", // Algeria
  "TN", // Tunisia
  "EG", // Egypt
  "SA", // Saudi Arabia
  "AE", // UAE
  "FR", // France
  "ES", // Spain
  "DE", // Germany
  "GB", // UK
  "US", // USA
  "CA", // Canada
]
