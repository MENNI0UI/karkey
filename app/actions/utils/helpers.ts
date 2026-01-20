/**
 * Common utilities for server actions
 * Photo normalization, data transformation, and shared helpers
 * 
 * NOTE: This file does NOT use "use server" because it exports constants.
 * These are utilities meant to be called FROM server actions, not exposed as server actions themselves.
 */

import path from "path"

export const DEFAULT_VEHICLE_IMAGE = "/assets/images/default-car.png"

/**
 * Normalize a photo URL to ensure it's properly formatted
 * Handles S3 URLs, local paths, and relative paths
 */
export function normalizePhotoUrl(p: unknown): string {
  if (!p) return DEFAULT_VEHICLE_IMAGE
  const s = String(p).trim()
  if (!s) return DEFAULT_VEHICLE_IMAGE
  if (s.startsWith("http://") || s.startsWith("https://") || s.startsWith("/")) return s
  return `/uploads/vehicles/${path.basename(s)}`
}

/**
 * Extract vehicle condition from a row
 * Handles various database row formats
 */
export function pickVehicleCondition(row: Record<string, unknown> | null | undefined): string | null {
  if (!row) return null
  const v = row["vehicle_condition"]
  if (v === undefined || v === null) return null
  const s = String(v).trim()
  return s === "" ? null : s
}

/**
 * Check if a filter value represents "all" (no filtering)
 */
export function isAllFilter(v?: string | string[]): boolean {
  if (!v) return true
  if (Array.isArray(v)) {
    return v.length === 0 || (v.length === 1 && String(v[0]).toLowerCase() === "all")
  }
  return String(v).trim() === "" || String(v).toLowerCase() === "all"
}

/**
 * Normalize array filter values, removing "all" entries
 */
export function normalizeArrayFilter(val: string | string[] | undefined): string[] {
  if (!val) return []
  if (Array.isArray(val)) {
    return val.filter(v => v && String(v).toLowerCase() !== "all")
  }
  const str = String(val).trim()
  if (str === "" || str.toLowerCase() === "all") return []
  return [str]
}

/**
 * Parse a numeric filter value safely
 */
export function parseNumericFilter(val: string | undefined): number | null {
  if (!val) return null
  const num = parseFloat(val)
  return isNaN(num) ? null : num
}

/**
 * Parse an integer filter value safely
 */
export function parseIntFilter(val: string | undefined): number | null {
  if (!val) return null
  const num = parseInt(val, 10)
  return isNaN(num) ? null : num
}
