import { ZodError } from 'zod';

// ============================================
// Unified Error Codes & Normalization
// ============================================

export enum ErrorCode {
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    UNAUTHORIZED = 'UNAUTHORIZED',
    FORBIDDEN = 'FORBIDDEN',
    RATE_LIMITED = 'RATE_LIMITED',
    DB_ERROR = 'DB_ERROR',
    TIMEOUT = 'TIMEOUT',
    NETWORK_ERROR = 'NETWORK_ERROR',
    UNKNOWN = 'UNKNOWN',
}

export interface AppError {
    code: ErrorCode;
    message: string;
    details?: unknown;
}

/**
 * Normalize any error into a structured AppError.
 * Handles ZodError, timeouts, and generic errors.
 */
export function normalizeError(err: unknown): AppError {
    // Handle Zod validation errors
    if (err instanceof ZodError) {
        return {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Invalid input',
            details: err.flatten(),
        };
    }

    // Handle custom validation errors from parseOrThrow
    if (isValidationError(err)) {
        return {
            code: ErrorCode.VALIDATION_ERROR,
            message: 'Invalid input',
            details: err.issues,
        };
    }

    // Handle Error instances
    if (err instanceof Error) {
        // Timeout detection
        if (err.message.includes('timed out') || err.message.includes('timeout')) {
            return { code: ErrorCode.TIMEOUT, message: 'Request timed out. Please try again.' };
        }

        // Database errors (Prisma)
        if (err.message.includes('prisma') || err.message.includes('database') || err.message.includes('connection')) {
            return { code: ErrorCode.DB_ERROR, message: 'Database error. Please try again later.' };
        }

        // Rate limiting
        if (err.message.includes('rate limit') || err.message.includes('too many requests')) {
            return { code: ErrorCode.RATE_LIMITED, message: 'Too many requests. Please wait and try again.' };
        }

        return { code: ErrorCode.UNKNOWN, message: err.message };
    }

    return { code: ErrorCode.UNKNOWN, message: 'An unknown error occurred' };
}

/**
 * Type guard for ValidationError from parseOrThrow.
 */
function isValidationError(err: unknown): err is { code: 'VALIDATION_ERROR'; issues: unknown } {
    return (
        typeof err === 'object' &&
        err !== null &&
        'code' in err &&
        (err as any).code === 'VALIDATION_ERROR'
    );
}

/**
 * Create a standardized error response for Server Actions.
 */
export function errorResponse(err: unknown): { success: false; error: AppError } {
    return { success: false, error: normalizeError(err) };
}
