
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendAuctionReminderEmail } from "@/lib/email";

// This endpoint should be called by a cron job (e.g., Vercel Cron) every Saturday at 00:00
export async function GET(req: NextRequest) {
    try {
        // Optional: Add a secret key check to prevent unauthorized triggering
        const authHeader = req.headers.get("authorization");
        if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
        }

        // 1. Get all active subscribers with their language preference
        const subscribers = await prisma.auction_reminders.findMany({
            where: { is_active: true },
            select: { email: true, id: true, language: true },
        });

        if (subscribers.length === 0) {
            return NextResponse.json({ success: true, message: "No active subscribers found" });
        }

        console.log(`[Cron] Sending auction reminders to ${subscribers.length} users`);

        // 2. Send emails in batches to avoid rate limits
        const results = {
            success: 0,
            failed: 0,
        };

        const BATCH_SIZE = 50;
        for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
            const batch = subscribers.slice(i, i + BATCH_SIZE);
            const promises = batch.map(async (sub) => {
                // Use the subscriber's preferred language, default to 'en'
                const lang = sub.language || 'en';
                const res = await sendAuctionReminderEmail(sub.email, lang);
                if (res.success) results.success++;
                else results.failed++;
            });
            await Promise.all(promises);
        }

        return NextResponse.json({
            success: true,
            sent: results.success,
            failed: results.failed
        });

    } catch (error) {
        console.error("Cron error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
