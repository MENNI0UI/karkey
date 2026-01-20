/**
 * Security utilities for safe operations
 */

/**
 * Safe string comparison that is resistant to timing attacks.
 * Used for comparing passwords and other sensitive values in client-side validation.
 * Note: For actual authentication, use bcrypt.compare on the server.
 */
export function safeStringCompare(a: string | null | undefined, b: string | null | undefined): boolean {
    if (a === null || a === undefined || b === null || b === undefined) {
        return a === b
    }

    // Ensure both strings are the same length by comparing lengths first
    if (a.length !== b.length) {
        return false
    }

    // Compare character by character in constant time
    let result = 0
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }
    return result === 0
}

/**
 * Sanitize a URL to ensure it's safe for use in img src or other attributes.
 * Only allows http, https, data (for base64 images), and relative URLs.
 */
export function sanitizeImageUrl(url: string | null | undefined): string {
    if (!url || typeof url !== 'string') {
        return '/placeholder.svg'
    }

    const trimmed = url.trim()

    // Allow relative URLs (starting with /)
    if (trimmed.startsWith('/')) {
        return trimmed
    }

    // Allow data URLs for base64 images
    if (trimmed.startsWith('data:image/')) {
        return trimmed
    }

    // Validate http/https URLs
    try {
        const parsed = new URL(trimmed)
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return trimmed
        }
    } catch {
        // Invalid URL, return placeholder
    }

    return '/placeholder.svg'
}

/**
 * Validate and sanitize a redirect URL against a whitelist of trusted hosts.
 * Returns a safe fallback URL if the input is not trusted.
 */
export function validateRedirectUrl(
    url: string | null | undefined,
    allowedHosts: string[],
    fallbackUrl: string = '/'
): string {
    if (!url || typeof url !== 'string') {
        return fallbackUrl
    }

    try {
        const parsed = new URL(url)

        // Check if the hostname matches any allowed host
        const isTrusted = allowedHosts.some(host =>
            parsed.hostname === host ||
            parsed.hostname.endsWith('.' + host)
        )

        if (isTrusted) {
            return url
        }
    } catch {
        // Invalid URL format
    }

    return fallbackUrl
}
