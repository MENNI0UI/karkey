import { getCurrentUser } from "@/lib/mysql-auth";

// Force dynamic rendering
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Server-Sent Events stream for notifications (best-effort, in-memory).
// Includes cleanup on disconnect to prevent memory leaks.

// Type for SSE connection entries
type ControllerEntry = { controller: ReadableStreamDefaultController; createdAt: number };

// Global map key and type
const MAP_KEY = "__NOTIF_SSE_MAP";
type SSEMap = Map<number, Set<ControllerEntry>>;

// Initialize global map if not exists
function getSSEMap(): SSEMap {
  if (!(globalThis as { [key: string]: unknown })[MAP_KEY]) {
    (globalThis as { [key: string]: unknown })[MAP_KEY] = new Map<number, Set<ControllerEntry>>();

    // Start periodic cleanup (every 5 minutes) - runs once globally
    if (typeof setInterval !== 'undefined') {
      setInterval(() => {
        cleanupStaleConnections();
      }, 5 * 60 * 1000);
    }
  }
  return (globalThis as { [key: string]: unknown })[MAP_KEY] as SSEMap;
}

// Cleanup connections older than 1 hour (stale/zombie connections)
function cleanupStaleConnections(): void {
  const map = getSSEMap();
  const now = Date.now();
  const MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

  for (const [userId, set] of map.entries()) {
    for (const entry of set) {
      if (now - entry.createdAt > MAX_AGE_MS) {
        try {
          entry.controller.close?.();
        } catch { /* ignore */ }
        set.delete(entry);
      }
    }
    if (set.size === 0) {
      map.delete(userId);
    }
  }
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) return new Response("Unauthorized", { status: 401 });
    const userId =
      (user as { userId?: number; id?: number }).userId ??
      (user as { id?: number }).id;
    if (!userId) return new Response("Invalid user", { status: 400 });

    const map = getSSEMap();
    const encoder = new TextEncoder();

    // Use TransformStream approach for better Node.js 22 compatibility
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    // Store writer for later pushes
    const set = map.get(Number(userId)) || new Set<ControllerEntry>();

    // Create entry with timestamp for cleanup tracking
    const fakeController = {
      enqueue: (data: Uint8Array) => {
        writer.write(data).catch(() => { });
      },
      close: () => {
        writer.close().catch(() => { });
      }
    } as unknown as ReadableStreamDefaultController;

    const entry: ControllerEntry = {
      controller: fakeController,
      createdAt: Date.now()
    };
    set.add(entry);
    map.set(Number(userId), set);

    // IMPORTANT: Cleanup on client disconnect (AbortController)
    request.signal.addEventListener('abort', () => {
      set.delete(entry);
      if (set.size === 0) {
        map.delete(Number(userId));
      }
      writer.close().catch(() => { /* ignore close errors */ });
    });

    // Send initial ping
    writer.write(encoder.encode(`: ok\n\n`)).catch(() => { });

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

