import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ listingId: string }> }
) {
    try {
        const { listingId } = await params;
        const id = parseInt(listingId, 10);

        if (isNaN(id)) {
            return NextResponse.json({ error: "Invalid listing ID" }, { status: 400 });
        }

        // 1. Get the listing to check the owner
        const listing = await prisma.direct_sales.findUnique({
            where: { id },
            select: { user_id: true },
        });

        if (!listing) {
            return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        }

        // 2. Check if the current user is obtaining the view
        const session = await auth();

        if (session?.user?.id) {
            // 3. If the viewer is the owner, do NOT increment
            // Note: listing.user_id is BigInt/Int, session.user.id is string
            if (Number(listing.user_id) === Number(session.user.id)) {
                return NextResponse.json({ success: true, ignored: true });
            }
        }

        // Increment views atomically
        await prisma.direct_sales.update({
            where: { id },
            data: { views: { increment: 1 } },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("[API] Error incrementing views:", error);
        return NextResponse.json({ error: "Failed to increment views" }, { status: 500 });
    }
}
