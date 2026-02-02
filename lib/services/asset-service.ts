import fs from "fs/promises"
import { constants } from "fs"
import path from "path"

export type AssetResolution =
    | { type: 'FILE'; filePath: string; contentType: string; size: number }
    | { type: 'REDIRECT'; url: string }
    | { type: 'NOT_FOUND' }
    | { type: 'FORBIDDEN' };

export class AssetService {
    private static readonly CONTENT_TYPE_MAP: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
        ".svg": "image/svg+xml",
        ".avif": "image/avif",
        ".mp4": "video/mp4",
        ".webm": "video/webm",
    };

    /**
     * Sanitizes path segments to prevent path traversal attacks.
     * Removes any segment that could escape the uploads directory.
     */
    private static sanitizePathSegments(segments: string[]): string[] | null {
        const sanitized: string[] = [];
        for (const segment of segments) {
            // Reject null bytes (poison null byte attack)
            if (segment.includes('\0')) return null;
            // Reject path traversal attempts
            if (segment === '..' || segment === '.' || segment.includes('/') || segment.includes('\\')) {
                return null;
            }
            // Reject empty segments
            if (segment.trim() === '') continue;
            // Only allow safe characters: alphanumeric, dash, underscore, dot, parenthesis
            if (!/^[\w\-. ()]+$/i.test(segment)) {
                return null;
            }
            sanitized.push(segment);
        }
        return sanitized.length > 0 ? sanitized : null;
    }

    /**
     * Async check if file exists
     */
    private static async fileExists(filePath: string): Promise<boolean> {
        try {
            await fs.access(filePath, constants.F_OK);
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Resolves a requested asset path to a physical file, a redirect, or an error state.
     * Handles security checks, cloud fallbacks, and format optimization (AVIF/WebP).
     */
    static async resolve(pathSegments: string[], acceptHeader: string = ""): Promise<AssetResolution> {
        // 0. Sanitize input path segments BEFORE any path operations
        const sanitizedSegments = this.sanitizePathSegments(pathSegments);
        if (!sanitizedSegments) {
            return { type: 'FORBIDDEN' };
        }

        // 1. Path Security Construction
        const uploadsDir = path.resolve(process.cwd(), "public", "uploads")
        const filePath = path.join(uploadsDir, ...sanitizedSegments)
        const resolvedPath = path.resolve(filePath)

        // Security: ensure the path doesn't escape the uploads directory (defense in depth)
        // Note: resolvedPath checks done synchronously as they are string ops usually, but safe enough here
        if (!resolvedPath.startsWith(uploadsDir + path.sep) && resolvedPath !== uploadsDir) {
            return { type: 'FORBIDDEN' };
        }

        // 2. Check Local Existence & Cloud Fallback
        let targetPath = resolvedPath;
        const exists = await this.fileExists(targetPath);

        if (!exists) {
            const storageBaseUrl = process.env.STORAGE_BASE_URL;
            if (storageBaseUrl) {
                // Use sanitized segments for cloud URL
                const cloudUrl = `${storageBaseUrl.replace(/\/$/, "")}/${sanitizedSegments.join("/")}`;
                return { type: 'REDIRECT', url: cloudUrl };
            }
            return { type: 'NOT_FOUND' };
        }

        // 3. Format-Aware Optimization (Sub-Phase 4.2 logic)
        // Sanitize acceptHeader to only allow expected MIME types
        const safeAcceptHeader = this.sanitizeAcceptHeader(acceptHeader);
        targetPath = await this.optimizeFormat(targetPath, safeAcceptHeader);

        // 4. Prepare File Details
        try {
            const stats = await fs.stat(targetPath)
            const ext = path.extname(targetPath).toLowerCase()
            const contentType = this.CONTENT_TYPE_MAP[ext] || "application/octet-stream"

            return {
                type: 'FILE',
                filePath: targetPath,
                contentType,
                size: stats.size
            };
        } catch (error) {
            console.error("[AssetService] Stat error:", error);
            return { type: 'NOT_FOUND' };
        }
    }

    /**
     * Sanitizes the Accept header to only extract valid image MIME types.
     * This prevents any potential injection through the Accept header.
     */
    private static sanitizeAcceptHeader(acceptHeader: string): string {
        // Only allow known safe image MIME types
        const allowedTypes = ['image/avif', 'image/webp', 'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
        const found: string[] = [];
        for (const mimeType of allowedTypes) {
            if (acceptHeader.includes(mimeType)) {
                found.push(mimeType);
            }
        }
        return found.join(', ');
    }

    /**
     * Attempts to find a better format (AVIF/WebP) for the requested file
     */
    private static async optimizeFormat(originalPath: string, acceptHeader: string): Promise<string> {
        const originalExt = path.extname(originalPath).toLowerCase();
        // Only optimize classic image formats
        if (![".jpg", ".jpeg", ".png"].includes(originalExt)) {
            return originalPath;
        }

        const dir = path.dirname(originalPath);
        const base = path.basename(originalPath, originalExt);

        // 1. Try AVIF
        if (acceptHeader.includes("image/avif")) {
            const avifPath = path.join(dir, `${base}.avif`);
            if (await this.fileExists(avifPath)) return avifPath;
        }

        // 2. Try WebP
        if (acceptHeader.includes("image/webp")) {
            const webpPath = path.join(dir, `${base}.webp`);
            if (await this.fileExists(webpPath)) return webpPath;
        }

        return originalPath;
    }
}

