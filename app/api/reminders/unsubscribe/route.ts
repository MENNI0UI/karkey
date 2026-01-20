
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get("token");

        if (!token) {
            return NextResponse.json(
                { success: false, error: "Token is required" },
                { status: 400 }
            );
        }

        // Decode base64 token to get email
        let email: string;
        try {
            email = Buffer.from(token, "base64").toString("utf-8");
        } catch {
            return NextResponse.json(
                { success: false, error: "Invalid token" },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, error: "Invalid token" },
                { status: 400 }
            );
        }

        // Update the reminder to inactive
        const result = await prisma.auction_reminders.updateMany({
            where: {
                email,
                is_active: true
            },
            data: {
                is_active: false,
                updated_at: new Date(),
            },
        });

        if (result.count === 0) {
            return NextResponse.json({
                success: true,
                alreadyUnsubscribed: true,
                message: "You are already unsubscribed",
            });
        }

        return NextResponse.json({
            success: true,
            alreadyUnsubscribed: false,
            message: "Successfully unsubscribed from auction reminders",
        });
    } catch (error) {
        console.error("Unsubscribe error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
