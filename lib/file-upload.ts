import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"
import { maybeApplyWatermark, getContentTypeFromExt } from "./image-processing"

// Image processing (watermarking, resizing, formatting) is now handled in lib/image-processing.ts

export async function saveFileLocally(file: File, folder: string): Promise<string> {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", folder)
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split(".").pop()
    const filename = `${folder}_${timestamp}.${extension}`
    const filepath = join(uploadsDir, filename)

    // Convert File to Buffer
    const bytes = await file.arrayBuffer()
    let buffer: Uint8Array = Buffer.from(bytes)

    // Apply watermark if enabled and this is an image
    const contentType = getContentTypeFromExt(extension);
    const { data } = await maybeApplyWatermark(buffer, contentType, filename);
    buffer = data as Uint8Array;

    // Save file
    await writeFile(filepath, buffer)

    // Return public URL path
    return `/uploads/${folder}/${filename}`
  } catch (error) {
    console.error("[v0] File upload error:", error)
    throw new Error("Failed to upload file")
  }
}

export async function saveBase64FileLocally(base64Data: string, folder: string): Promise<string> {
  try {
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads", folder)
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Extract base64 data and determine file extension
    const matches = base64Data.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/)
    if (!matches) {
      throw new Error("Invalid base64 image data")
    }

    const extension = matches[1]
    const base64Content = matches[2]

    // Generate unique filename
    const timestamp = Date.now()
    const filename = `${folder}_${timestamp}.${extension}`
    const filepath = join(uploadsDir, filename)

    // Convert base64 to Buffer
    let buffer: Uint8Array = Buffer.from(base64Content, "base64")

    // Apply watermark if enabled
    const contentType = `image/${extension}`;
    const { data } = await maybeApplyWatermark(buffer, contentType, filename);
    buffer = data as Uint8Array;

    // Save file
    await writeFile(filepath, buffer)

    // Return public URL path
    return `/uploads/${folder}/${filename}`
  } catch (error) {
    console.error("[v0] Base64 file upload error:", error)
    throw new Error("Failed to upload file")
  }
}
