import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

const DRIVER = process.env.STORAGE_DRIVER || "local";
const LOCAL_UPLOADS = join(process.cwd(), "public", "uploads", "vehicles");
import { maybeApplyWatermark } from "./image-processing";
const S3_BUCKET = process.env.S3_BUCKET || process.env.S3_SPACE_BUCKET;
const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_REGION = process.env.S3_REGION;
const S3_KEY = process.env.S3_KEY;
const S3_SECRET = process.env.S3_SECRET;
const STORAGE_BASE_URL = process.env.STORAGE_BASE_URL;

// S3 client and commands module - loaded dynamically
// Using Awaited<ReturnType> pattern for proper typing
type S3Module = typeof import("@aws-sdk/client-s3");
let s3Client: InstanceType<S3Module["S3Client"]> | null = null;
let AwsS3Module: S3Module | null = null;

async function getS3Client() {
  if (s3Client) return s3Client;

  try {
    const mod = await import("@aws-sdk/client-s3");
    AwsS3Module = mod;

    const { S3Client: S3ClientClass } = mod;

    s3Client = new S3ClientClass({
      region: S3_REGION,
      endpoint: S3_ENDPOINT || undefined,
      credentials:
        S3_KEY && S3_SECRET
          ? { accessKeyId: S3_KEY, secretAccessKey: S3_SECRET }
          : undefined,
      forcePathStyle: !!S3_ENDPOINT,
    });

    return s3Client;
  } catch {
    throw new Error(
      "Missing dependency @aws-sdk/client-s3. Install it using: npm install @aws-sdk/client-s3"
    );
  }
}

async function ensureLocalDir() {
  if (!existsSync(LOCAL_UPLOADS)) {
    await mkdir(LOCAL_UPLOADS, { recursive: true });
  }
}

export async function uploadFile(
  buffer: Buffer | ArrayBuffer | ArrayBufferView | string,
  filename: string,
  contentType = "application/octet-stream"
): Promise<string> {
  // Normalize incoming payload into Buffer | Uint8Array once
  let bodyToSend: Buffer | Uint8Array;
  if (typeof buffer === "string") {
    bodyToSend = Buffer.from(buffer);
  } else if (Buffer.isBuffer(buffer)) {
    bodyToSend = buffer;
  } else if (buffer instanceof ArrayBuffer) {
    bodyToSend = new Uint8Array(buffer);
  } else if (ArrayBuffer.isView(buffer)) {
    const view = buffer;
    bodyToSend = new Uint8Array(view.buffer, view.byteOffset, view.byteLength);
  } else {
    // last-resort coercion - this shouldn't happen with proper types
    bodyToSend = Buffer.from(String(buffer));
  }

  // Optionally apply watermark when enabled and when contentType indicates an image
  try {
    const { data: processedBody, contentType: finalContentType } = await maybeApplyWatermark(bodyToSend, contentType, filename);
    bodyToSend = processedBody;
    contentType = finalContentType;
  } catch (err) {
    // If watermarking throws (e.g., missing sharp), surface a helpful message but continue with original buffer
    console.warn("[storage] maybeApplyWatermark failed:", err);
  }

  if (DRIVER === "s3") {
    const client = await getS3Client();
    const Key = filename;
    const Bucket = S3_BUCKET!;
    if (!AwsS3Module?.PutObjectCommand) {
      throw new Error("S3 PutObjectCommand not available. Ensure @aws-sdk/client-s3 is installed.");
    }
    const { PutObjectCommand } = AwsS3Module;
    await client.send(
      new PutObjectCommand({
        Bucket,
        Key,
        Body: bodyToSend,
        ContentType: contentType,
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    if (STORAGE_BASE_URL) return `${STORAGE_BASE_URL.replace(/\/$/, "")}/${Key}`;
    if (S3_ENDPOINT) return `${S3_ENDPOINT.replace(/\/$/, "")}/${Bucket}/${Key}`;
    return `https://${Bucket}.s3.${S3_REGION}.amazonaws.com/${Key}`;
  } else {
    await ensureLocalDir();
    const filePath = join(LOCAL_UPLOADS, filename);
    // write normalized buffer/uint8array directly (use a narrow assertion so TS picks the correct overload)
    await writeFile(filePath, bodyToSend as Buffer | Uint8Array);
    return `/api/uploads/vehicles/${encodeURIComponent(filename)}`;
  }
}

// Local watermarking helper removed in favor of lib/image-processing.ts

export function getPublicUrl(filename: string): string {
  if (DRIVER === "s3") {
    const Key = filename;
    if (STORAGE_BASE_URL)
      return `${STORAGE_BASE_URL.replace(/\/$/, "")}/${Key}`;
    if (S3_ENDPOINT)
      return `${S3_ENDPOINT.replace(/\/$/, "")}/${S3_BUCKET}/${Key}`;
    return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${Key}`;
  }
  return `/api/uploads/vehicles/${encodeURIComponent(filename)}`;
}

export async function deleteFile(filename: string) {
  if (DRIVER === "s3") {
    const client = await getS3Client();

    if (!AwsS3Module?.DeleteObjectCommand) {
      throw new Error("DeleteObjectCommand not available in AWS SDK");
    }
    const { DeleteObjectCommand } = AwsS3Module;

    await client.send(
      new DeleteObjectCommand({ Bucket: S3_BUCKET!, Key: filename })
    );

    return;
  }

  try {
    const filePath = join(LOCAL_UPLOADS, filename);
    if (existsSync(filePath)) {
      await unlink(filePath);
    }
  } catch { }
}
