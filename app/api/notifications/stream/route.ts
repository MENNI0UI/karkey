import { getCurrentUser } from "@/lib/mysql-auth";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Server-Sent Events stream for notifications (best-effort, in-memory).
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) return new Response("Unauthorized", { status: 401 });
    const userId =
      (user as { userId?: number; id?: number }).userId ??
      (user as { id?: number }).id;
    if (!userId) return new Response("Invalid user", { status: 400 });

    // Ensure map exists
    const MAP_KEY = "__NOTIF_SSE_MAP";
    type ControllerEntry = { controller: ReadableStreamDefaultController };
    if (!(globalThis as { [key: string]: unknown })[MAP_KEY]) {
      (globalThis as { [key: string]: unknown })[MAP_KEY] = new Map<number, Set<ControllerEntry>>();
    }
    const map = (globalThis as { [key: string]: unknown })[MAP_KEY] as Map<number, Set<ControllerEntry>>;

    const encoder = new TextEncoder();

    // Use TransformStream approach for better Node.js 22 compatibility
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    // Store writer for later pushes
    const set = map.get(Number(userId)) || new Set<ControllerEntry>();
    // We'll adapt the old interface - store a fake controller
    const fakeController = {
      enqueue: (data: Uint8Array) => {
        writer.write(data).catch(() => {});
      },
      close: () => {
        writer.close().catch(() => {});
      }
    } as unknown as ReadableStreamDefaultController;
    set.add({ controller: fakeController });
    map.set(Number(userId), set);

    // Send initial ping
    writer.write(encoder.encode(`: ok\n\n`)).catch(() => {});

    const headers = new Headers({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    });

    return new Response(readable, { headers });
  } catch (err) {
    console.error("[api/notifications/stream] Error:", err);
    return new Response("Server error", { status: 500 });
  }
}
