import { NextResponse } from "next/server"
import path from "node:path"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { maybeApplyWatermark, getContentTypeFromExt } from "@/lib/image-processing"
import { getCurrentUser } from "@/lib/mysql-auth"
import { isRateLimited, getIp, RATE_LIMITS } from "@/lib/rate-limiter"
import { validateFileSignature, validateFileSize } from "@/lib/file-validation"

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
})

export async function POST(request: Request) {
  try {
    // 0. Origin Validation (CSRF Protection)
    const origin = request.headers.get("origin")
    const allowedOrigins = [
      "https://karkey.space",
      "https://www.karkey.space",
      "http://localhost:3000" // Development fallback
    ]

    // Only validate origin if it's present (some clients/tools might not send it, but browsers do for CORS/POST)
    if (origin && !allowedOrigins.includes(origin) && process.env.NODE_ENV === "production") {
      return NextResponse.json({ success: false, error: "Invalid Origin" }, { status: 403 })
    }

    // 1. Authentication Check
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // 2. Rate Limiting
    const ip = getIp(request)
    if (await isRateLimited(`upload:${ip}`, RATE_LIMITS.UPLOAD)) {
      return NextResponse.json({ success: false, error: "Too many upload requests" }, { status: 429 })
    }

    // Starting upload request processing

    let formData;
    try {
      formData = await request.formData()
    } catch (e) {
      console.error("[api/upload] Failed to parse formData (Client disconnect?)", e)
      throw e
    }

    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    // 3. Validation (Size & Magic Bytes)
    if (!validateFileSize(file, 20)) { // Increased to 20MB limit (Client compresses, but raw files valid too)
      return NextResponse.json({ success: false, error: "File too large (max 20MB)" }, { status: 400 })
    }

    const isValidSignature = await validateFileSignature(file)
    if (!isValidSignature) {
      return NextResponse.json({ success: false, error: "Invalid file type (spoofed extension detect)" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const originalName = (file as { name?: string }).name || `upload-${Date.now()}`
    const safeName = originalName.replaceAll(/[^a-zA-Z0-9.\-_]/g, "_")
    let uniqueName = `${Date.now()}-${safeName}`
    const ext = path.extname(safeName)

    // Apply watermark to images
    let buffer: Uint8Array = Buffer.from(arrayBuffer)
    const contentTypeFromExt = getContentTypeFromExt(ext.replace('.', ''))
    const isClientOptimized = request.headers.get("x-optimized") === "1"

    // Processing file
    let finalContentType = file.type || contentTypeFromExt || 'application/octet-stream';

    // Only apply server-side watermark if client didn't already do it
    if (!isClientOptimized) {
      try {
        // Applying server-side watermark & Force WebP conversion
        const { data, contentType: newContentType } = await maybeApplyWatermark(buffer, contentTypeFromExt, uniqueName)
        buffer = data as Uint8Array

        if (newContentType) {
          finalContentType = newContentType;
          // If converted to WebP, update extension in uniqueName
          if (newContentType === 'image/webp' && !uniqueName.endsWith('.webp')) {
            // Replace extension with .webp
            const lastDotIdx = uniqueName.lastIndexOf('.');
            if (lastDotIdx !== -1) {
              uniqueName = uniqueName.substring(0, lastDotIdx) + '.webp';
            } else {
              uniqueName = uniqueName + '.webp';
            }
          }
        }
      } catch (e) {
        console.error("Watermark/Processing failed", e)
      }
    } else {
      // Client handled it (High Performance Path)
      // We trust the client-side watermark
    }

    // Generate Placeholder (BlurHash equivalent)
    let blurhash: string | null = null;
    try {
      if (finalContentType.startsWith("image/")) {
        const { generateTinyPlaceholder } = await import("@/lib/image-processing");
        blurhash = await generateTinyPlaceholder(buffer);
      }
    } catch (e) {
      console.warn("Blurhash generation failed", e);
    }

    // Upload to Cloudflare R2
    // Key uses the potentially updated uniqueName (with .webp extension)
    const key = `vehicles/${uniqueName}`

    // Sending to R2

    await R2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: finalContentType,
    }))

    // Upload success

    // URL to be used by client (served from R2 Public Domain)
    const url = `${process.env.R2_PUBLIC_DOMAIN}/${key}`

    return NextResponse.json({ success: true, url, blurhash })
  } catch (err: unknown) {
    console.error("[api/upload] upload error:", err)
    return NextResponse.json({
      success: false,
      error: "Upload failed. Please try again."
    }, { status: 500 })
  }
}

