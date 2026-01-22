/**
 * Client-side image compression utility
 * Reduces image size before upload to improve performance and reduce bandwidth usage.
 */

interface CompressionOptions {
    maxWidth?: number;
    maxHeight?: number;
    quality?: number; // 0 to 1
    type?: string; // 'image/jpeg', 'image/png', etc.
}

/**
 * Compresses an image file using standard HTML5 Canvas API
 */
export async function compressImage(
    file: File,
    options: CompressionOptions = {}
): Promise<File> {
    // Default options for "Smart High-Fidelity Compression"
    // 1920x1080 is sufficient for Retina displays on mobile/desktop
    // 0.85 quality offers ~80-90% size reduction with imperceptible visual loss
    const {
        maxWidth = 1920,
        maxHeight = 1080,
        quality = 0.85,
        type = "image/jpeg",
    } = options;

    return new Promise((resolve, reject) => {
        // If not an image, return original
        if (!file.type.startsWith("image/")) {
            resolve(file);
            return;
        }

        const image = new Image();
        image.src = URL.createObjectURL(file);

        image.onload = () => {
            // Release memory
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

            // Draw image
            ctx.drawImage(image, 0, 0, width, height);

            // Convert to blob/file
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error("Canvas compression failed"));
                        return;
                    }

                    // Create new file with same name/lastModified but compressed content
                    const compressedFile = new File([blob], file.name, {
                        type: type,
                        lastModified: Date.now(),
                    });

                    // Helpful debug log
                    console.log(
                        `[ImageCompression] Compressed ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`
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
