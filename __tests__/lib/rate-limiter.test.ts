import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isRateLimited } from '@/lib/rate-limiter';

describe('Rate Limiter', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        // Assuming the rate limiter implementation uses an internal map that we can't easily clear directly
        // apart from maybe mocking Date.now() to a far future or using unique keys per test.
        // Since we can't clear the module-level cache easily without re-importing, 
        // we will use unique IP keys for each test case.
    });

    it('allows requests within the limit', () => {
        const key = 'ip-1';
        const limit = 5;
        const windowMs = 60000;

        for (let i = 0; i < limit; i++) {
            expect(isRateLimited(key, { limit, windowMs })).toBe(false);
        }
    });

    it('blocks requests exceeding the limit', () => {
        const key = 'ip-2';
        const limit = 3;
        const windowMs = 60000;

        // Consume limit
        for (let i = 0; i < limit; i++) {
            isRateLimited(key, { limit, windowMs });
        }

        // Next request should be blocked
        expect(isRateLimited(key, { limit, windowMs })).toBe(true);
    });

    it('resets after window expires', () => {
        const key = 'ip-3';
        const limit = 1;
        const windowMs = 1000;

        // Block logic
        expect(isRateLimited(key, { limit, windowMs })).toBe(false); // Count = 1
        expect(isRateLimited(key, { limit, windowMs })).toBe(true);  // Count = 2 (blocked)

        // Advance time
        vi.advanceTimersByTime(windowMs + 100);

        // Should be allowed again
        expect(isRateLimited(key, { limit, windowMs })).toBe(false);
    });
});
