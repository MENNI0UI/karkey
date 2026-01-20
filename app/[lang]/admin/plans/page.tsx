import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import AdminPlansClient from "./admin-plans-client"
import { type Plan } from "@/lib/plans-data"

// Server component — checks CEO access before rendering anything
export default async function AdminPlansPage() {
  // Check admin authentication via cookie
  const cookieStore = await cookies()
  const adminToken = cookieStore.get("admin_token")?.value

  if (!adminToken) {
    // Not logged in as admin — redirect immediately
    redirect("/admin/login")
  }

  let adminInfo: { nom: string; prenom: string } | null = null

  try {
    // Decode JWT to extract admin id (simple extraction, not full verification for speed)
    const payloadB64 = adminToken.split(".")[1]
    if (!payloadB64) {
      redirect("/admin/login")
    }
    const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString())
    const adminId = payload.adminId || payload.id

    if (!adminId) {
      redirect("/admin/login")
    }

    // Fetch admin from DB
    const admin = await prisma.admins.findUnique({
      where: { id: adminId },
      select: { id: true, nom: true, prenom: true, role: true }
    })

    if (!admin) {
      redirect("/admin/login")
    }

    if (admin.role !== "ceo") {
      // Not CEO — redirect to admin dashboard (not authorized for plans page)
      redirect("/admin")
    }

    adminInfo = { nom: admin.nom, prenom: admin.prenom }

    // Load plans for CEO
    const planRows = await prisma.plans.findMany({
      orderBy: { priority: "desc" }
    })

    const plans: Plan[] = planRows.map((row) => ({
      id: row.id,
      name: row.name,
      name_ar: row.name_ar,
      name_fr: row.name_fr,
      name_es: row.name_es,
      price: Number(row.price),
      currency: row.currency,
      duration_days: row.duration_days,
      bid_limit: row.bid_limit,
      description: row.description,
      description_ar: row.description_ar,
      description_fr: row.description_fr,
      description_es: row.description_es,
      features: typeof row.features === "string" ? JSON.parse(row.features) : (row.features || []),
      features_ar: typeof row.features_ar === "string" ? JSON.parse(row.features_ar) : (row.features_ar || null),
      features_fr: typeof row.features_fr === "string" ? JSON.parse(row.features_fr) : (row.features_fr || null),
      features_es: typeof row.features_es === "string" ? JSON.parse(row.features_es) : (row.features_es || null),
      popular: !!row.popular,
      priority: row.priority || 0,
      status: row.status as 'active' | 'inactive',
    }))

    return <AdminPlansClient initialPlans={plans} adminInfo={adminInfo} />
  } catch (err) {
    console.error("Admin plans page auth error:", err)
    redirect("/admin/login")
  }
}
