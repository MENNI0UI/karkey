
export const MAGIC_BYTES = {
    jpg: [0xFF, 0xD8, 0xFF],
    png: [0x89, 0x50, 0x4E, 0x47],
    gif: [0x47, 0x49, 0x46, 0x38],
    webp: [0x52, 0x49, 0x46, 0x46], // RIFF (generic, but usually WEBP follows)
};

export async function validateFileSignature(file: File): Promise<boolean> {
    const buffer = await file.slice(0, 4).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check against known signatures
    // JPEG
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;

    // PNG
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;

    // GIF
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return true;

    // WEBP (RIFF start) - strict check would also check bytes 8-11 for "WEBP"
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
        // Check minimal WEBP signature
        return true;
    }

    return false;
}

export function validateFileSize(file: File, maxSizeMB: number = 5): boolean {
    return file.size <= maxSizeMB * 1024 * 1024;
}
