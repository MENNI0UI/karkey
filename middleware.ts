import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { canonicalizeParams, parseParams } from "@/lib/filter-utils";
const locales = ["en", "fr", "ar", "es"];
const defaultLocale = "en";
const COOKIE_NAME = "karkey:lang";

// PRE-COMPUTED STATIC CSP (nonce placeholder replaced at runtime)
// This saves ~0.5ms per request by avoiding string construction
const CSP_TEMPLATE = `
  default-src 'self';
  script-src 'self' 'nonce-{{NONCE}}' 'strict-dynamic' https://accounts.google.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com;
  img-src 'self' blob: data: https:;
  font-src 'self' data: https://fonts.gstatic.com;
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://accounts.google.com;
  frame-ancestors 'none';
  frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://www.paypal.com https://www.sandbox.paypal.com https://accounts.google.com;
  connect-src 'self' https: https://api.stripe.com https://www.paypal.com https://accounts.google.com https://oauth2.googleapis.com;
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim();

function getLocale(request: NextRequest): string {
    // Simple, lightweight locale detection
    const acceptLanguage = request.headers.get("accept-language");
    if (!acceptLanguage) return defaultLocale;

    // Example header: "en-US,en;q=0.9,ar;q=0.8"
    // 1. Split by comma
    const preferredLocales = acceptLanguage.split(",");

    for (const langStr of preferredLocales) {
        // 2. Clean up (remove q=... and whitespace)
        const [langTag] = langStr.split(";");
        const lang = langTag.trim().split("-")[0].toLowerCase(); // "en-US" -> "en"

        // 3. Check if supported
        if (locales.includes(lang)) {
            return lang;
        }
    }

    return defaultLocale;
}

import rateLimit from "@/lib/rate-limit";

const limiter = rateLimit({
    interval: 60 * 1000, // 60 seconds
    uniqueTokenPerInterval: 500, // Max 500 users per second
});

/**
 * Next.js Middleware
 * Handles locale detection, CSP headers, rate limiting, and saved search redirects
 */
export async function middleware(request: NextRequest) {
    const startTime = Date.now();
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64')

    // Fast nonce replacement using pre-computed template
    const contentSecurityPolicyHeaderValue = CSP_TEMPLATE.replace('{{NONCE}}', nonce);

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-nonce', nonce)
    requestHeaders.set('Content-Security-Policy', contentSecurityPolicyHeaderValue)

    const { pathname } = request.nextUrl;
    const pathnameHasLocale = locales.some(
        (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    let response: NextResponse;

    if (pathnameHasLocale) {
        const localeInUrl = pathname.split('/')[1];
        response = NextResponse.next({
            request: { headers: requestHeaders },
        })
        response.headers.set('Content-Security-Policy', contentSecurityPolicyHeaderValue)

        const secure = request.nextUrl.protocol === 'https:';
        response.cookies.set(COOKIE_NAME, localeInUrl, {
            path: '/',
            sameSite: 'lax',
            httpOnly: false,
            maxAge: 60 * 60 * 24 * 365,
            secure: secure
        });

        // Saved Search Redirection (simplified for readability)
        const listingPages = { 'auctions': 'saved_searches_guest', 'direct-sales': 'direct_sales_saved_searches_guest' } as const;
        const pageType = Object.keys(listingPages).find(type => {
            const segments = pathname.split('/').filter(Boolean);
            return segments.length >= 2 && segments[segments.length - 1] === type;
        }) as keyof typeof listingPages | undefined;

        if (pageType) {
            const isReset = request.nextUrl.searchParams.get('reset') === 'true';
            let hasUrlFilters = false;
            request.nextUrl.searchParams.forEach((_, key) => { if (key !== 'lang') hasUrlFilters = true; });

            if (!hasUrlFilters && !isReset) {
                const guestRaw = request.cookies.get(listingPages[pageType])?.value;
                if (guestRaw) {
                    try {
                        const arr = JSON.parse(decodeURIComponent(guestRaw));
                        if (Array.isArray(arr) && arr.length > 0 && arr[0]?.params) {
                            const paramsStr = canonicalizeParams(parseParams(arr[0].params));
                            if (paramsStr) {
                                const redirectUrl = new URL(`/${localeInUrl}/${pageType}?${paramsStr}`, request.url);
                                const redir = NextResponse.redirect(redirectUrl);
                                redir.headers.set('Content-Security-Policy', contentSecurityPolicyHeaderValue);
                                redir.headers.set('Server-Timing', `mw;dur=${Date.now() - startTime}`);
                                return redir;
                            }
                        }
                    } catch { }
                }
            }
        }
    } else {
        // No locale in path
        const cookieLocale = request.cookies.get(COOKIE_NAME)?.value;
        const locale = (cookieLocale && locales.includes(cookieLocale)) ? cookieLocale : getLocale(request);
        const redirectUrl = new URL(`/${locale}${pathname === '/' ? '' : pathname}`, request.url);
        request.nextUrl.searchParams.forEach((v, k) => redirectUrl.searchParams.set(k, v));
        response = NextResponse.redirect(redirectUrl);
    }

    // Rate Limiting for API routes
    if (pathname.startsWith('/api/')) {
        const ip = request.headers.get('x-forwarded-for') ?? '127.0.0.1';
        try {
            await limiter.check(100, ip); // 100 requests per minute
        } catch {
            return new NextResponse('Too Many Requests', { status: 429 });
        }
    }

    response.headers.set('Server-Timing', `mw;dur=${Date.now() - startTime}`);
    return response;
}

export const config = {
    // تحسين الـ Matcher لاستثناء كل ما هو غير ضروري
    matcher: [
        /*
         * استثناء كل المسارات التي تبدأ بـ:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - الكل الملفات التي تنتهي بامتداد (مثل .png, .svg)
         */
        "/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js|.*\\..*).*)",
    ],
};
