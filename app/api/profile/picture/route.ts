import { NextResponse } from "next/server"
import path from "path"
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3"
import { updateProfilePicture } from "@/app/[lang]/profile/actions"

const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
})

export async function POST(req: Request) {
  try {
    const formData = await req.formData()
    const file = formData.get("picture") as File | null
    const userIdRaw = formData.get("userId")

    if (!file || !userIdRaw) {
      return NextResponse.json({ success: false, error: "Missing file or userId" }, { status: 400 })
    }
    const userId = Number(String(userIdRaw))
    if (!Number.isFinite(userId) || userId <= 0) {
      return NextResponse.json({ success: false, error: "Invalid userId" }, { status: 400 })
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // safe filename
    const originalName = (file as any).name ? String((file as any).name) : `${Date.now()}.jpg`
    const safeBase = originalName.replace(/[^a-zA-Z0-9._-]/g, "_")
    const ext = path.extname(safeBase) || (file.type === "image/png" ? ".png" : ".jpg")
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`

    let uploadedUrl: string
    try {
      const key = `profile/${userId}/${filename}`

      await R2.send(new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: buffer,
        ContentType: file.type || (ext === ".png" ? "image/png" : "image/jpeg"),
      }))

      // URL to be used by client (served from R2 Public Domain)
      uploadedUrl = `${process.env.R2_PUBLIC_DOMAIN}/${key}`
    } catch (e) {
      console.error("[api/profile/picture] R2 upload failed:", e)
      return NextResponse.json({ success: false, error: "Failed to upload file to R2" }, { status: 500 })
    }

    // Persist URL in DB
    try {
      const upd = await updateProfilePicture(userId, uploadedUrl)
      if (!upd || !upd.success) {
        console.error("[api/profile/picture] updateProfilePicture failed:", upd)
        return NextResponse.json({ success: false, error: "Failed to save profile url" }, { status: 500 })
      }
    } catch (err) {
      console.error("[api/profile/picture] DB update error:", err)
      return NextResponse.json({ success: false, error: "Failed to save profile url" }, { status: 500 })
    }

    return NextResponse.json({ success: true, url: uploadedUrl })
  } catch (err: any) {
    console.error("[api/profile/picture] unexpected error:", err)
    return NextResponse.json({ success: false, error: err?.message ?? "Upload failed" }, { status: 500 })
  }
}
