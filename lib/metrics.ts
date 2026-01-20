import { crypto } from "next/dist/compiled/@edge-runtime/primitives/crypto"

/**
 * Lightweight metrics and logging utility for Karkey.
 * Provides Correlation ID (reqId) tracking across logs and performance measurements.
 */

export interface MetricEntry {
    reqId: string
    label: string
    duration?: number
    message?: string
    metadata?: Record<string, any>
    timestamp: string
}

/**
 * Generates a standard metrics log entry.
 */
function logMetric(entry: MetricEntry) {
    // In production, this can be sent to Sentry, Logflare, or a custom sink.
    // For now, we use structured console logging for observability.
    console.log(`[METRIC] ${JSON.stringify(entry)}`)
}

export class RequestContext {
    public readonly reqId: string
    private marks: Map<string, number> = new Map()

    constructor(reqId?: string) {
        this.reqId = reqId || (globalThis.crypto?.randomUUID?.() ?? "req-" + Math.random().toString(36).slice(2, 9))
    }

    /**
     * Starts a performance timer for a labeled task.
     */
    start(label: string) {
        this.marks.set(label, performance.now())
    }

    /**
     * Ends a performance timer and logs the duration.
     */
    end(label: string, metadata?: Record<string, any>) {
        const startTime = this.marks.get(label)
        if (startTime === undefined) return

        const duration = parseFloat((performance.now() - startTime).toFixed(2))
        this.marks.delete(label)

        logMetric({
            reqId: this.reqId,
            label,
            duration,
            metadata,
            timestamp: new Date().toISOString()
        })

        return duration
    }

    /**
     * Logs a simple event or message tied to the request ID.
     */
    info(label: string, message: string, metadata?: Record<string, any>) {
        logMetric({
            reqId: this.reqId,
            label,
            message,
            metadata,
            timestamp: new Date().toISOString()
        })
    }
}

/**
 * Helper to create a context. Can be used in Middleware or API Routes.
 */
export function createMetricsContext(reqId?: string) {
    return new RequestContext(reqId)
}
