"use client"

import { useState, useRef, useCallback } from "react"
import logger from "@/lib/logger"

export type UploadStatus = 'pending' | 'uploading' | 'completed' | 'error'

export interface UploadItem {
    id: string
    file?: File
    url?: string
    blurhash?: string
    status: UploadStatus
    error?: string
}

interface UseImageUploadOptions {
    watermark?: boolean
    maxWidth?: number
    maxHeight?: number
    quality?: number
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
    // Track active uploads to block submission
    const uploadPromisesRef = useRef<Map<string, Promise<any>>>(new Map())

    // Helper to compress image (lazy load the compression lib)
    const compress = async (file: File): Promise<{ file: File, isProcessed: boolean }> => {
        try {
            if (!file.type.startsWith('image/')) return { file, isProcessed: false }

            const { compressImage } = await import("@/lib/client-image-compression")
            const compressed = await compressImage(file, {
                maxWidth: options.maxWidth || 1200,
                maxHeight: options.maxHeight || 1200,
                quality: options.quality || 0.7,
                watermark: options.watermark ?? false
            })
            return { file: compressed, isProcessed: true }
        } catch (e) {
            logger.warn("Compression failed, using original", e)
            return { file, isProcessed: false }
        }
    }

    const upload = useCallback(async (
        file: File,
        id: string,
        onStatusChange: (id: string, patch: Partial<UploadItem>) => void
    ) => {
        // 1. Initial State
        onStatusChange(id, { status: 'uploading', error: undefined })

        const promise = (async () => {
            try {
                // 2. Compress
                const { file: uploadFile, isProcessed } = await compress(file)

                // 3. Upload
                const fd = new FormData()
                fd.append("file", uploadFile)

                const headers: Record<string, string> = {}
                if (isProcessed) {
                    headers['x-optimized'] = '1'
                }

                const res = await fetch("/api/upload", {
                    method: "POST",
                    body: fd,
                    headers
                })

                if (!res.ok) throw new Error(`Status ${res.status}`)
                const json = await res.json()
                if (!json.success) throw new Error(json.error || "Upload failed")

                // 4. Success
                onStatusChange(id, {
                    status: 'completed',
                    url: json.url,
                    blurhash: json.blurhash,
                    // We can optionally keep or remove the file. 
                    // Keeping it might use memory, but good for previews if URL isn't immediate (though it is here)
                    file: undefined
                })

                return json
            } catch (err: any) {
                logger.error("Upload failed", id, err)
                onStatusChange(id, {
                    status: 'error',
                    error: err.message || "Failed to upload"
                })
                throw err
            } finally {
                uploadPromisesRef.current.delete(id)
            }
        })()

        uploadPromisesRef.current.set(id, promise)
        return promise
    }, [options.maxWidth, options.maxHeight, options.quality, options.watermark])

    const waitForAll = useCallback(async () => {
        const promises = Array.from(uploadPromisesRef.current.values())
        if (promises.length > 0) {
            await Promise.allSettled(promises)
        }
    }, [])

    const hasActiveUploads = () => uploadPromisesRef.current.size > 0

    return {
        upload,
        waitForAll,
        hasActiveUploads
    }
}
