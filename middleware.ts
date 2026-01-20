import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { match } from "@formatjs/intl-localematcher";
import Negotiator from "negotiator";
import { canonicalizeParams, parseParams } from "@/lib/filter-utils";

const locales = ["en", "fr", "ar", "es"];
const defaultLocale = "en";
const COOKIE_NAME = "karkey:lang";

function getLocale(request: NextRequest): string {
  const headers = { "accept-language": request.headers.get("accept-language") || "" };
  const languages = new Negotiator({ headers }).languages();

  try {
    return match(languages, locales, defaultLocale);
  } catch (error) {
    return defaultLocale;
  }
}

export function middleware(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64')
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://accounts.google.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com;
    img-src 'self' blob: data: https: http:;
    font-src 'self' data: https://fonts.gstatic.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self' https://accounts.google.com;
    frame-ancestors 'none';
    frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://www.paypal.com https://www.sandbox.paypal.com https://accounts.google.com;
    connect-src 'self' https: http: https://api.stripe.com https://www.paypal.com https://accounts.google.com https://oauth2.googleapis.com;
    upgrade-insecure-requests;
  `
  // Replace newline characters and extra spaces
  const contentSecurityPolicyHeaderValue = cspHeader
    .replace(/\s{2,}/g, ' ')
    .trim()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)
  requestHeaders.set(
    'Content-Security-Policy',
    contentSecurityPolicyHeaderValue
  )

  const { pathname } = request.nextUrl;

  // 1. اكتشاف اللغة الموجودة في الرابط حالياً
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // إذا كان الرابط يحتوي على لغة، لا تفعل شيئاً (اترك المستخدم يتصفح ما اختاره)
  if (pathnameHasLocale) {
    const localeInUrl = pathname.split('/')[1];

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    response.headers.set(
      'Content-Security-Policy',
      contentSecurityPolicyHeaderValue
    )

    // تحديث الكوكي ليتناسب مع اختيار المستخدم الحالي في الرابط
    const secure = request.nextUrl.protocol === 'https:';
    response.cookies.set(COOKIE_NAME, localeInUrl, {
      path: '/',
      sameSite: 'lax',
      httpOnly: false, // نتركه false إذا كنت تحتاجه في الـ Client side
      maxAge: 60 * 60 * 24 * 365, // سنة واحدة
      secure: secure
    });
    // 1.5. Saved Search Redirection Logic (Guest Only for Middleware speed)
    const listingPages = {
      'auctions': 'saved_searches_guest',
      'direct-sales': 'direct_sales_saved_searches_guest'
    } as const;

    const pageType = Object.keys(listingPages).find(type => {
      // Match only listing page paths, NOT detail pages like /direct-sales/123
      // Pattern: ends with /{type} OR pathname segment is exactly /{type} followed by query params
      const segments = pathname.split('/').filter(Boolean);
      // Should match: /en/auctions, /en/direct-sales?filters, etc.
      // Should NOT match: /en/auctions/123, /en/direct-sales/123/edit, etc.
      return segments.length >= 2 && segments[segments.length - 1] === type;
    }) as keyof typeof listingPages | undefined;

    if (pageType) {
      // Check if any filters are present (excluding 'lang' which might be in query or handled by path)
      const ignoredKeys = new Set(['lang']);
      let hasUrlFilters = false;
      request.nextUrl.searchParams.forEach((_, key) => {
        if (!ignoredKeys.has(key)) hasUrlFilters = true;
      });

      // Explicit bypass: if ?reset=true is present, do not redirect
      const isReset = request.nextUrl.searchParams.get('reset') === 'true';

      if (!hasUrlFilters && !isReset) {
        const cookieName = listingPages[pageType];
        const guestRaw = request.cookies.get(cookieName)?.value;
        if (guestRaw) {
          try {
            const arr = JSON.parse(decodeURIComponent(guestRaw));
            if (Array.isArray(arr) && arr.length > 0) {
              const latest = arr[0];
              const p = latest?.params;
              if (p) {
                const paramsStr = canonicalizeParams(parseParams(p));
                if (paramsStr) {
                  const lang = pathname.split('/')[1];
                  const redirectUrl = new URL(`/${lang}/${pageType}?${paramsStr}`, request.url);
                  console.log(`[Middleware] Fast redirect for guest (${pageType}):`, redirectUrl.toString());
                  const response = NextResponse.redirect(redirectUrl);
                  // Apply security headers to redirect response too
                  response.headers.set('Content-Security-Policy', contentSecurityPolicyHeaderValue);
                  return response;
                }
              }
            }
          } catch (e) {
            console.error(`[Middleware] Error parsing guest cookie ${cookieName}:`, e);
          }
        }
      }
    }

    return response;
  }

  // 2. إذا لم يكن هناك لغة في الرابط، ابحث عن اللغة المناسبة
  const cookieLocale = request.cookies.get(COOKIE_NAME)?.value;
  const locale = (cookieLocale && locales.includes(cookieLocale))
    ? cookieLocale
    : getLocale(request);

  // إعادة توجيه للرابط مع اللغة
  const redirectUrl = new URL(`/${locale}${pathname === '/' ? '' : pathname}`, request.url);

  // نقل الـ Search Params (مثل ?query=123) للرابط الجديد
  request.nextUrl.searchParams.forEach((value, key) => {
    redirectUrl.searchParams.set(key, value);
  });

  return NextResponse.redirect(redirectUrl);
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
