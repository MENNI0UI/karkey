import { NextRequest, NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    
    const logEntry = {
      ...body,
      receivedAt: new Date().toISOString()
    }
    
    // Log to console
    console.error("[ErrorLogger] Client error received:", JSON.stringify(logEntry, null, 2))
    
    // Also append to a file for persistence
    try {
      const logPath = path.join(process.cwd(), "client_errors.log")
      fs.appendFileSync(logPath, JSON.stringify(logEntry) + "\n")
    } catch (e) {
      console.error("[ErrorLogger] Failed to write to log file:", e)
    }
    
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("[ErrorLogger] Failed to process error log:", e)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
