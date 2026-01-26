/**
 * Client-side image compression utility
 * Reduces image size before upload to improve performance and reduce bandwidth usage.
 */

interface CompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0 to 1
    type?: string; // 'image/jpeg', 'image/png', etc.
    watermark?: boolean;
}

// Helper to detect HEIC
const isHeic = (file: File) =>
    file.type.toLowerCase() === 'image/heic' ||
    file.type.toLowerCase() === 'image/heif' ||
    file.name.toLowerCase().endsWith('.heic') ||
    file.name.toLowerCase().endsWith('.heif');

// Cache the watermark image to avoid reloading
let cachedWatermark: HTMLImageElement | null = null;
const loadWatermark = (): Promise<HTMLImageElement> => {
    if (cachedWatermark) return Promise.resolve(cachedWatermark);
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.src = "/logo.png";
        img.onload = () => {
            cachedWatermark = img;
            resolve(img);
        };
        img.onerror = () => reject(new Error("Failed to load watermark"));
    });
};

/**
 * Compresses an image file using standard HTML5 Canvas API
 */
export async function compressImage(
    file: File,
    options: CompressionOptions = {}
): Promise<File> {
    const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.85,
        type = "image/jpeg",
        watermark = true, // Default to true for protection
    } = options;

    // HEIC Conversion Support
    if (isHeic(file)) {
        try {
            console.log(`[ImageCompression] Converting HEIC: ${file.name}`);
            const heic2any = (await import("heic2any")).default;
            const convertedBlob = await heic2any({
                blob: file,
                toType: "image/jpeg",
                quality: 0.9 // High quality intermediate
            });

            // Handle array result (shouldn't happen for single file, but safe check)
            const finalBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

            // Replace original file with converted jpeg
            file = new File([finalBlob], file.name.replace(/\.heic$/i, ".jpg"), {
                type: "image/jpeg",
                lastModified: Date.now()
            });
        } catch (e) {
            console.error("HEIC conversion failed", e);
            // Fallback: try standard compression flow, might fail but worth a shot
        }
    }

    return new Promise(async (resolve, reject) => {
        // Prepare watermark if needed
        let watermarkImg: HTMLImageElement | null = null;
        if (watermark) {
            try {
                watermarkImg = await loadWatermark();
            } catch (e) {
                console.warn("Could not load watermark", e);
            }
        }

        // Check standard browser support (skip if not image)
        if (!file.type.startsWith("image/") && !isHeic(file)) {
            resolve(file);
            return;
        }

        const image = new Image();
        image.src = URL.createObjectURL(file);

        image.onload = () => {
            URL.revokeObjectURL(image.src);

            let width = image.width;
            let height = image.height;

            // Calculate new dimensions while maintaining aspect ratio
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.floor(width * ratio);
                height = Math.floor(height * ratio);
            }

            // Create canvas
            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Failed to get canvas context"));
                return;
            }

            // 1. Draw Image
            ctx.drawImage(image, 0, 0, width, height);

            // 2. Draw Watermark (Tiled Pattern)
            if (watermarkImg) {
                ctx.save();
                ctx.globalAlpha = 0.1; // 10% opacity for background grid

                // Scale logo relative to image size
                // Target: Logo width = 40% of image width (Bigger)
                const scale = (width * 0.4) / watermarkImg.width;
                const w = width * 0.4;
                const h = watermarkImg.height * scale;

                // Tiled pattern
                // Rotate standard -20 degrees
                ctx.rotate(-20 * Math.PI / 180);

                // Draw in a grid covering the canvas (and extra for rotation)
                const gap = w * 1.2; // Tighter gap for bigger logos
                for (let x = -width; x < width * 2; x += gap) {
                    for (let y = -height; y < height * 2; y += gap) {
                        ctx.drawImage(watermarkImg, x, y, w, h);
                    }
                }

                // Add Central Branding
                ctx.restore();
                ctx.save();
                ctx.globalAlpha = 0.3; // 30% opacity for center brand
                const centerW = width * 0.5; // Bigger center (50%)
                const centerScale = centerW / watermarkImg.width;
                const centerH = watermarkImg.height * centerScale;
                // Center
                ctx.drawImage(watermarkImg, (width - centerW) / 2, (height - centerH) / 2, centerW, centerH);
                ctx.restore();
            }

            // Convert to blob/file
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error("Canvas compression failed"));
                        return;
                    }

                    // Create new file
                    const compressedFile = new File([blob], file.name, {
                        type: type,
                        lastModified: Date.now(),
                    });

                    console.log(
                        `[ImageCompression] Processed ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
                    );

                    resolve(compressedFile);
                },
                type,
                quality
            );
        };

        image.onerror = (err) => {
            URL.revokeObjectURL(image.src);
            reject(err);
        };
    });
}
