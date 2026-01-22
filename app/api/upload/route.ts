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

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
    }

    // 3. Validation (Size & Magic Bytes)
    if (!validateFileSize(file, 5)) { // 5MB limit
      return NextResponse.json({ success: false, error: "File too large (max 5MB)" }, { status: 400 })
    }

    const isValidSignature = await validateFileSignature(file)
    if (!isValidSignature) {
      return NextResponse.json({ success: false, error: "Invalid file type (spoofed extension detect)" }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const originalName = (file as { name?: string }).name || `upload-${Date.now()}`
    const safeName = originalName.replaceAll(/[^a-zA-Z0-9.\-_]/g, "_")
    const uniqueName = `${Date.now()}-${safeName}`
    const ext = path.extname(safeName)

    // Apply watermark to images
    let buffer: Uint8Array = Buffer.from(arrayBuffer)
    const contentTypeFromExt = getContentTypeFromExt(ext.replace('.', ''))

    // Additional Safety: explicit catch for image processing
    try {
      const { data } = await maybeApplyWatermark(buffer, contentTypeFromExt, uniqueName)
      buffer = data as Uint8Array
    } catch (e) {
      console.error("Watermark/Processing failed", e)
      // Continue without watermark if fail, or fail? Let's continue but log.
    }

    // Upload to Cloudflare R2
    const key = `vehicles/${uniqueName}`

    await R2.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type || contentTypeFromExt || 'application/octet-stream',
    }))

    // URL to be used by client (served from R2 Public Domain)
    const url = `${process.env.R2_PUBLIC_DOMAIN}/${key}`

    return NextResponse.json({ success: true, url })
  } catch (err: unknown) {
    console.error("[api/upload] upload error:", err)
    return NextResponse.json({
      success: false,
      error: "Upload failed. Please try again."
    }, { status: 500 })
  }
}

