import { NextResponse } from "next/server";
import {
    prepareAuctionsForWeekend,
    activateAllAuctions,
    endAllAuctions,
    getSystemStatus
} from "@/lib/simple-auction-system";

/**
 * API route for auction automation
 * 
 * 🆕 MySQL Events يتولى الأتمتة الآن:
 * - auto_end_expired_auctions: كل دقيقة (إنهاء المزادات المنتهية)
 * - auto_prepare_auctions: الجمعة 23:55 (تحضير المزادات)
 * - auto_activate_auctions: السبت 00:00 (تفعيل المزادات)
 * 
 * هذا الـ API للتشغيل اليدوي فقط من لوحة التحكم
 * 
 * GET /api/cron/auction-automation - Get automation status
 * POST /api/cron/auction-automation - Force run automation (admin only)
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    
    // Return status by default
    if (!action || action === "status") {
        const systemStatus = await getSystemStatus();
        
        return NextResponse.json({
            success: true,
            message: "🆕 MySQL Events يتولى الأتمتة - هذا API للتشغيل اليدوي فقط",
            automation: "MySQL Events (database level)",
            events: {
                end_auctions: "every 1 MINUTE",
                prepare_auctions: "Friday 23:55",
                activate_auctions: "Saturday 00:00"
            },
            systemStatus,
        });
    }
    
    // Force run if action=run and secret is valid
    if (action === "run") {
        const secret = searchParams.get("secret");
        
        // In production, validate against environment variable
        if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
            console.log("[Cron] ⚠️ Unauthorized attempt to run auction automation");
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        console.log("[Cron] 🚗 Manual auction automation triggered");
        
        const [prepareResult, activateResult, endResult] = await Promise.all([
            prepareAuctionsForWeekend(),
            activateAllAuctions(),
            endAllAuctions()
        ]);
        
        return NextResponse.json({
            success: true,
            message: "Auction automation completed successfully",
            results: {
                prepare: prepareResult,
                activate: activateResult,
                end: endResult
            },
            timestamp: new Date().toISOString(),
        });
    }

    // Individual actions for testing
    if (action === "prepare") {
        const result = await prepareAuctionsForWeekend();
        return NextResponse.json({ success: true, action: "prepare", result });
    }

    if (action === "activate") {
        const result = await activateAllAuctions();
        return NextResponse.json({ success: true, action: "activate", result });
    }

    if (action === "end") {
        const result = await endAllAuctions();
        return NextResponse.json({ success: true, action: "end", result });
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// Also support POST for manual triggers from admin panel
export async function POST(request: Request) {
    const startTime = Date.now();
    
    // Check authorization header or body
    let authorized = false;
    
    try {
        const body = await request.json().catch(() => ({}));
        const authHeader = request.headers.get("authorization");
        
        // Check if authorized via header or body
        if (process.env.CRON_SECRET) {
            authorized = 
                authHeader === `Bearer ${process.env.CRON_SECRET}` ||
                body.secret === process.env.CRON_SECRET;
        } else {
            // No secret configured, allow in development
            authorized = process.env.NODE_ENV !== "production";
        }
    } catch {
        authorized = process.env.NODE_ENV !== "production";
    }
    
    if (!authorized) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron] 🚗 Auction automation triggered via POST");
    
    try {
        const [prepareResult, activateResult, endResult] = await Promise.all([
            prepareAuctionsForWeekend(),
            activateAllAuctions(),
            endAllAuctions()
        ]);
        
        const duration = Date.now() - startTime;
        
        return NextResponse.json({
            success: true,
            message: "🆕 Auction automation completed successfully",
            duration: `${duration}ms`,
            results: {
                prepared: prepareResult.count,
                activated: activateResult.count,
                ended: {
                    completed: endResult.completed,
                    reserveNotMet: endResult.reserveNotMet,
                    returned: endResult.returned
                }
            },
            timestamp: new Date().toISOString(),
        });
        
    } catch (error) {
        console.error("[Cron] ❌ Auction automation failed:", error);
        
        return NextResponse.json(
            {
                success: false,
                message: "Auction automation failed",
                error: error instanceof Error ? error.message : "Unknown error",
                timestamp: new Date().toISOString(),
            },
            { status: 500 }
        );
    }
}
