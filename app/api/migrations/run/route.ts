import { NextResponse } from "next/server"
import { runMigrations } from "@/lib/migrations"

/**
 * API endpoint لتنفيذ الـ migrations
 * يمكن استدعاؤه من المتصفح: /api/migrations/run
 */
export async function POST() {
  try {
    const result = await runMigrations()
    return NextResponse.json(result)
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST method to run migrations",
    endpoint: "/api/migrations/run",
  })
}
