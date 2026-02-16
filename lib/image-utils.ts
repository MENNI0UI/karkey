/**
 * Utility for normalizing image URLs across the application.
 * Handles R2 storage, data URLs, blobs, and external links.
 */

/**
 * Normalizes a vehicle photo URL.
 * If the path is relative or just a filename, it points it to the R2 vehicles bucket.
 */
export const normalizePhotoUrl = (p: string | null | undefined): string => {
    if (!p) return "/placeholder-car.jpg";
    const s = String(p).trim();
    if (s.startsWith("data:image/")) return s;
    if (s.startsWith("blob:")) return s;
    if (s.startsWith("http://") || s.startsWith("https://")) {
        try {
            const url = new URL(s);
            if (url.protocol === "http:" || url.protocol === "https:") return s;
        } catch {
            return "/placeholder-car.jpg";
        }
    }
    // Fallback for relative paths or filenames - Point to vehicles bucket
    const filename = s.includes("/") ? s.split("/").pop() || s : s;
    return `https://img.karkey.space/vehicles/${filename}`;
};

/**
 * Normalizes a profile/avatar URL.
 * If the path is relative or just a filename, it points it to the R2 profiles bucket.
 */
export const normalizeAvatarUrl = (p: string | null | undefined): string | null => {
    if (!p || p === "/placeholder.svg") return null;
    const s = String(p).trim();
    if (s.startsWith("data:image/")) return s;
    if (s.startsWith("blob:")) return s;
    if (s.startsWith("http://") || s.startsWith("https://")) {
        try {
            const url = new URL(s);
            if (url.protocol === "http:" || url.protocol === "https:") return s;
        } catch {
            return null;
        }
    }
    // Fallback for relative paths or filenames - Point to profiles bucket
    const filename = s.includes("/") ? s.split("/").pop() || s : s;
    return `https://img.karkey.space/profiles/${filename}`;
};
