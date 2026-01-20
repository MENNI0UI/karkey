
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic"; // Ensure this route is never cached

export async function GET() {
  return NextResponse.json({
    time: Date.now(),
  });
}
