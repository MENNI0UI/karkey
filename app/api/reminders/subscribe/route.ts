
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const subscribeSchema = z.object({
    email: z.string().email(),
    userId: z.number().optional(),
    language: z.string().optional().default("en"),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, userId, language } = subscribeSchema.parse(body);

        // Check if already subscribed
        const existing = await prisma.auction_reminders.findUnique({
            where: { email },
            select: { is_active: true, id: true },
        });

        if (existing?.is_active) {
            return NextResponse.json({
                success: true,
                alreadySubscribed: true,
                message: "You are already subscribed to auction reminders"
            });
        }

        // Upsert the reminder record
        const reminder = await prisma.auction_reminders.upsert({
            where: { email },
            update: {
                is_active: true,
                user_id: userId || undefined,
                language: language || "en",
                updated_at: new Date(),
            },
            create: {
                email,
                user_id: userId,
                language: language || "en",
                is_active: true,
            },
        });

        return NextResponse.json({
            success: true,
            alreadySubscribed: false,
            reminder
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: "Invalid email address" },
                { status: 400 }
            );
        }
        console.error("Subscription error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
