import { NextResponse } from "next/server"
import { resetDatabase, runMigrations } from "@/lib/migrations"

/**
 * API endpoint لإعادة تعيين قاعدة البيانات
 * تحذير: هذا سيحذف جميع البيانات!
 */
export async function POST() {
  try {
    // إعادة تعيين قاعدة البيانات
    await resetDatabase()

    // تنفيذ الـ migrations من جديد
    await runMigrations()

    return NextResponse.json({
      success: true,
      message: "Database reset and migrations completed",
    })
  } catch (error: unknown) {
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST method to reset database",
    warning: "This will delete ALL data!",
    endpoint: "/api/migrations/reset",
  })
}
