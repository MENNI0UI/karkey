import { getAdminFromCookie } from "@/lib/admin-auth"
import { NextResponse } from "next/server"
import { errorResponse } from "@/lib/errors"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const admin = await getAdminFromCookie()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.json({
      id: admin.id,
      prenom: admin.prenom,
      nom: admin.nom,
      role: admin.role,
    })
  } catch (error) {
    console.error("[Admin Me API] Error:", error)
    return NextResponse.json(errorResponse(error), { status: 500 })
  }
}
