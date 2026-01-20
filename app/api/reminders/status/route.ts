
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get("email");

        if (!email) {
            return NextResponse.json(
                { success: false, error: "Email is required" },
                { status: 400 }
            );
        }

        const reminder = await prisma.auction_reminders.findUnique({
            where: { email },
            select: { is_active: true, language: true },
        });

        return NextResponse.json({
            success: true,
            isSubscribed: reminder?.is_active ?? false,
            language: reminder?.language ?? "en",
        });
    } catch (error) {
        console.error("Status check error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
