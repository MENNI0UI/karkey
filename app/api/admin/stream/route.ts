import { getAdminFromCookie } from "@/lib/admin-auth"

export const dynamic = "force-dynamic"
// export const runtime = "nodejs" // Incompatible with useCache experiment

// Server-Sent Events stream for admin UI real-time updates (in-memory, best-effort)
export async function GET() {
  try {
    const admin = await getAdminFromCookie()
    if (!admin) return new Response("Unauthorized", { status: 401 })

    const MAP_KEY = "__ADMIN_SSE_MAP"
    type ControllerEntry = { controller: ReadableStreamDefaultController }
    if (!(globalThis as { [key: string]: unknown })[MAP_KEY]) {
      (globalThis as { [key: string]: unknown })[MAP_KEY] = new Set<ControllerEntry>()
    }
    const set = (globalThis as { [key: string]: unknown })[MAP_KEY] as Set<ControllerEntry>

    const encoder = new TextEncoder()

    // Use TransformStream approach for better Node.js 22 compatibility
    const { readable, writable } = new TransformStream()
    const writer = writable.getWriter()

    // Store writer for later pushes - adapt to old interface
    const fakeController = {
      enqueue: (data: Uint8Array) => {
        writer.write(data).catch(() => { })
      },
      close: () => {
        writer.close().catch(() => { })
      }
    } as unknown as ReadableStreamDefaultController
    const entry = { controller: fakeController }
    set.add(entry)

    // Send initial ping
    writer.write(encoder.encode(`: ok\n\n`)).catch(() => { })

    const headers = new Headers({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    })

    return new Response(readable, { headers })
  } catch (err) {
    console.error("[api/admin/stream] Error:", err)
    return new Response("Server error", { status: 500 })
  }
}
