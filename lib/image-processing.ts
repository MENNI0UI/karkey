import fs from "node:fs/promises";
import path from "node:path";

/**
 * Robust image processing utility for Karkey.
 * Handles resizing, light enhancements, watermarking, and format enforcement.
 */

let cachedLogoBase64: string | null = null;
async function getCachedLogo(): Promise<string> {
    if (cachedLogoBase64) return cachedLogoBase64;
    try {
        const logoPath = path.join(process.cwd(), "public", "logo.png");
        const logoBuffer = await fs.readFile(logoPath);
        cachedLogoBase64 = logoBuffer.toString('base64');
        return cachedLogoBase64;
    } catch {
        throw new Error("Failed to load logo");
    }
}

export async function maybeApplyWatermark(
    body: Uint8Array | Buffer,
    contentType: string,
    filename?: string
): Promise<{ data: Uint8Array | Buffer; contentType: string }> {
    try {
        // Processing buffer

        // Only process images
        if (!contentType?.startsWith("image/")) {
            return { data: body, contentType };
        }

        // dynamic import of sharp
        let mod: any;
        try {
            mod = await import("sharp");
        } catch (error) {
            console.warn("[image-processing] Missing 'sharp' dependency. Skipping processing.", error);
            return { data: body, contentType };
        }
        const sharp = mod.default ?? mod;

        const MAX_DIMENSION = 1600; // Faster resizing
        const WEBP_QUALITY = 75;

        let img = sharp(body);
        const meta = await img.metadata();

        // Validate real file type using Sharp metadata (not just content-type header)
        if (!meta.width || !meta.height) {
            console.error("[image-processing] Invalid image: no width/height in metadata");
            throw new Error("Invalid image file");
        }

        // High performance check: Avoid processing tiny images or already optimized webp
        const isSmall = body.length < 150 * 1024; // < 150KB
        const isWebP = contentType === "image/webp";
        const watermarkDisabled = (process.env.WATERMARK_ENABLED || "").toLowerCase() !== "1";

        if (isWebP && isSmall && watermarkDisabled) {
            // Fast path: return original
            return { data: body, contentType };
        }

        // Validate format is actually an image
        const validFormats = ['jpeg', 'jpg', 'png', 'webp', 'gif', 'avif', 'heif', 'heic'];
        if (!meta.format || !validFormats.includes(meta.format.toLowerCase())) {
            console.error(`[image-processing] Invalid image format: ${meta.format}`);
            throw new Error("Invalid image format");
        }

        // Additional Fast Path based on dimensions if no watermark needed
        if (
            watermarkDisabled &&
            meta.format === 'webp' &&
            (meta.width || 0) <= 1200 &&
            (meta.height || 0) <= 1200
        ) {
            return { data: body, contentType: "image/webp" };
        }

        let w = meta.width;
        let h = meta.height;

        // Resizing for web optimization
        if (w > MAX_DIMENSION || h > MAX_DIMENSION) {
            img = img.resize({
                width: MAX_DIMENSION,
                height: MAX_DIMENSION,
                fit: 'inside',
                withoutEnlargement: true
            });
            const scale = Math.min(MAX_DIMENSION / w, MAX_DIMENSION / h);
            if (scale) {
                w = Math.round(w * scale);
                h = Math.round(h * scale);
            }
        }

        // Watermark (only if enabled)
        const watermarkEnabled = (process.env.WATERMARK_ENABLED || "").toLowerCase();
        if (watermarkEnabled === "1" || watermarkEnabled === "true") {
            img = await applyWatermarkInternal(img, w, h);
        }

        // ENCODE & FORMAT FALLBACK
        // FORCE WEBP CONVERSION (Global Standard Optimization)
        // Convert all static images to WebP for maximum compression and performance
        // SVGs and GIFs are preserved to avoid breaking animations or vectors
        if (contentType === "image/gif" || contentType === "image/svg+xml") {
            return { data: body, contentType };
        }

        try {
            // High quality WebP is indistinguishable from JPEG but 40% smaller
            const out = await img.webp({ quality: WEBP_QUALITY, smartSubsample: true }).toBuffer();
            return { data: out, contentType: "image/webp" };
        } catch (encodeError) {
            // Fallback to original if WebP fails for some reason
            console.warn("[image-processing] WebP forced encoding failed, returning original:", encodeError);
            return { data: body, contentType };
        }

    } catch (err) {
        console.warn("[image-processing] Processing failed:", err);
        return { data: body, contentType };
    }
}

export function getContentTypeFromExt(ext: string | undefined): string {
    if (!ext) return 'application/octet-stream';
    const e = ext.toLowerCase().replace('.', '');
    switch (e) {
        case 'jpg':
        case 'jpeg': return 'image/jpeg';
        case 'png': return 'image/png';
        case 'webp': return 'image/webp';
        case 'gif': return 'image/gif';
        case 'svg': return 'image/svg+xml';
        case 'pdf': return 'application/pdf';
        default: return 'application/octet-stream';
    }
}

export async function generateTinyPlaceholder(
    body: Uint8Array | Buffer
): Promise<string | null> {
    try {
        // dynamic import of sharp (reusing logic pattern)
        let mod: any;
        try {
            mod = await import("sharp");
        } catch (error) {
            console.warn("[image-processing] Missing 'sharp' dependency. Skipping placeholder.", error);
            return null;
        }
        const sharp = mod.default ?? mod;

        const img = sharp(body);
        const metadata = await img.metadata();

        if (!metadata.width || !metadata.height) return null;

        // Resize to tiny dimension (10px) keeping aspect ratio
        const resizedBuffer = await img
            .resize({ width: 10, fit: 'inside' })
            .toFormat('jpeg', { quality: 60 }) // low quality jpeg is enough for blur
            .toBuffer();

        return `data:image/jpeg;base64,${resizedBuffer.toString('base64')}`;
    } catch (err) {
        console.warn("[image-processing] Placeholder generation failed:", err);
        return null;
    }
}

/**
 * Internal helper to apply watermark (logo or text)
 */
async function applyWatermarkInternal(img: any, w: number, h: number): Promise<any> {
    try {
        // Try to load logo for a professional look
        const logoBase64 = await getCachedLogo();
        const logoMime = "image/png";

        // Implementation matching the client-side style:
        const tileW = Math.round(w * 0.4);
        const tileH = tileW;
        const centerW = Math.round(w * 0.5);
        const centerH = centerW;

        const svg = `
        <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
            <defs>
                <pattern id="logoTile" x="0" y="0" width="${tileW * 1.5}" height="${tileW * 1.5}" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)">
                    <image href="data:${logoMime};base64,${logoBase64}" width="${tileW}" height="${tileH}" opacity="0.1" preserveAspectRatio="xMidYMid meet" />
                </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#logoTile)" />
            <image 
                href="data:${logoMime};base64,${logoBase64}" 
                x="${(w - centerW) / 2}" 
                y="${(h - centerH) / 2}" 
                width="${centerW}" 
                height="${centerH}" 
                opacity="0.3" 
                preserveAspectRatio="xMidYMid meet"
            />
        </svg>`;

        return img.composite([{ input: Buffer.from(svg), gravity: 'center' }]);
    } catch (logoError) {
        console.warn("[image-processing] Logo watermark failed, falling back to basic text:", logoError);
        const text = process.env.WATERMARK_TEXT ?? "karkey";
        const fontSize = Math.max(18, Math.round(Math.min(w, h) / 10));
        const svg = `
            <svg width="${w}" height="${h}">
                <style>
                    .t { fill: rgba(255,255,255,0.2); font-family: sans-serif; font-size: ${fontSize}px; font-weight: bold; }
                </style>
                <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" class="t" transform="rotate(-30 ${w / 2} ${h / 2})">
                    ${text}
                </text>
            </svg>`;

        return img.composite([{ input: Buffer.from(svg), gravity: 'center' }]);
    }
}
