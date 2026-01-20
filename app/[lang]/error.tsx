'use client'

import React, { useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log error details for debugging
        console.error("[ErrorBoundary] Caught error:", error)
        console.error("[ErrorBoundary] Error name:", error?.name)
        console.error("[ErrorBoundary] Error message:", error?.message)
        console.error("[ErrorBoundary] Error stack:", error?.stack)
        console.error("[ErrorBoundary] Error digest:", error?.digest)
        
        // Also write to server if possible
        try {
            fetch('/api/log-error', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: error?.name,
                    message: error?.message,
                    stack: error?.stack,
                    digest: error?.digest,
                    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
                    timestamp: new Date().toISOString()
                })
            }).catch(() => {})
        } catch {}
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 px-4">
            <div className="flex flex-col items-center gap-2 text-center">
                <div className="p-3 bg-red-100 rounded-full text-red-600">
                    <AlertCircle size={48} />
                </div>
                <h2 className="text-3xl font-bold tracking-tight">Something went wrong!</h2>
                <p className="text-muted-foreground text-lg max-w-md">
                    We encountered an unexpected error. Please try again later.
                </p>
            </div>
            <Button
                size="lg"
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
            >
                Try again
            </Button>
        </div>
    )
}
