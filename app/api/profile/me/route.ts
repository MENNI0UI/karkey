import { NextResponse } from "next/server";
import { debug, warn, error as logError } from "@/lib/logger";
import { errorResponse, ErrorCode } from "@/lib/errors";

export async function GET(request: Request) {
  try {
    let user: any = null;

    // If a helper getCurrentUser is defined in the runtime, use it
    const maybeGetCurrentUser = (global as any)?.getCurrentUser ?? (globalThis as any)?.getCurrentUser;
    if (typeof maybeGetCurrentUser === "function") {
      try {
        user = await maybeGetCurrentUser(request);
      } catch (e) {
        warn("[API][profile/me] getCurrentUser failed:", e);
      }
    }

    // Fallback: call internal auth endpoint
    if (!user) {
      try {
        const origin = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const res = await fetch(origin + "/api/auth/me", {
          headers: {
            cookie: request.headers.get("cookie") ?? "",
          },
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          user = data?.user ?? data ?? null;
        } else {
          warn("[API][profile/me] fallback /api/auth/me returned", res.status);
        }
      } catch (e) {
        warn("[API][profile/me] fallback fetch failed:", e);
      }
    }

    return NextResponse.json({ user: user ?? null });
  } catch (err: any) {
    if (err?.code === "DB_UNAVAILABLE" || String(err).includes("ECONNREFUSED")) {
      warn("[API][profile/me] DB unavailable");
      return NextResponse.json({ user: null, error: { code: ErrorCode.DB_ERROR, message: "database_unavailable" } }, { status: 503 });
    }
    logError("[API][profile/me] unexpected error:", err);
    return NextResponse.json({ user: null, ...errorResponse(err) }, { status: 500 });
  }
}
