import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { user_id, auction_id, title, message, type } = await req.json();
    if (!user_id || !auction_id || !title || !message || !type) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }
    
    const result = await prisma.notifications.create({
      data: {
        user_id,
        auction_id,
        title,
        message,
        type,
        is_read: false,
        created_at: new Date(),
      }
    });

    // Build notification object to send via SSE (best-effort)
    const notif = {
      id: result.id,
      user_id,
      auction_id,
      title,
      message,
      type,
      is_read: false,
      created_at: new Date().toISOString(),
    };

    // Publish to any connected SSE clients for this user (in-memory map)
    try {
      const map = (globalThis as { __NOTIF_SSE_MAP?: Map<number, Set<{ controller: ReadableStreamDefaultController }>> }).__NOTIF_SSE_MAP;
      if (map && map.has(Number(user_id))) {
        const set = map.get(Number(user_id));
        const payload = JSON.stringify({ notification: notif });
        const encoder = new TextEncoder();
        if (set) {
          for (const entry of set) {
            try {
              const controller = entry.controller;
              controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
            } catch {
              // ignore client write errors
            }
          }
        }
      }
    } catch {
      // don't block on SSE issues
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}
