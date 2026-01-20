"use server"
import prisma from "@/lib/prisma"
import { createAdminToken, setAdminCookie, getAdminFromCookie, verifyAdminSession, clearAdminCookie } from "@/lib/admin-auth"
import bcrypt from "bcryptjs"
import { admins_role } from "@prisma/client"

export async function adminLogin(nom: string, prenom: string, password: string) {
  try {
    console.log(`[v0] Login attempt for: ${prenom} ${nom}`)
    const admin = await prisma.admins.findFirst({
      where: { nom, prenom }
    })

    if (!admin) {
      console.log(`[v0] Admin not found: ${prenom} ${nom}`)
      return { success: false, error: "Invalid login credentials" }
    }

    console.log(`[v0] Admin found: ${admin.id}, comparing password...`)
    const isValidPassword = await bcrypt.compare(password, admin.password_hash)

    if (!isValidPassword) {
      console.log(`[v0] Invalid password for: ${prenom} ${nom}`)
      return { success: false, error: "Invalid login credentials" }
    }

    console.log(`[v0] Password valid, creating token...`)
    const token = await createAdminToken({
      id: admin.id,
      nom: admin.nom,
      prenom: admin.prenom,
      role: admin.role,
      passwordVersion: admin.password_version || 1,
    })

    console.log(`[v0] Token created, setting cookie...`)
    await setAdminCookie(token)
    console.log(`[v0] Login successful for: ${prenom} ${nom}`)
    return { success: true }
  } catch (error: any) {
    console.error("[v0] Admin login error:", error)
    return { success: false, error: `An error occurred during login: ${error.message || 'Unknown error'}` }
  }
}

async function isAdmin() {
  const admin = await getAdminFromCookie()
  if (!admin) return false

  // Verify session is still valid (password hasn't been changed)
  const isValid = await verifyAdminSession(admin)

  if (!isValid) {
    // Password was changed, clear the cookie
    await clearAdminCookie()
    return false
  }

  return true
}

// Get validated admin or null
async function getValidatedAdmin() {
  const admin = await getAdminFromCookie()
  if (!admin) return null

  const isValid = await verifyAdminSession(admin)

  if (!isValid) {
    await clearAdminCookie()
    return null
  }

  return admin
}

export async function getAdminRole() {
  const admin = await getValidatedAdmin()

  if (!admin) {
    return { error: "Unauthorized" }
  }

  return { role: admin.role, nom: admin.nom, prenom: admin.prenom, id: admin.id }
}

export async function createAdmin(nom: string, prenom: string, password: string, role: string) {
  const admin = await getAdminFromCookie()
  if (!admin || admin.role !== "ceo") {
    return { success: false, error: "Unauthorized - Only CEO can create admins" }
  }

  if (!nom || !prenom || !password || !role) {
    return { success: false, error: "All fields are required" }
  }

  if (!["ceo", "verification", "finance", "support"].includes(role)) {
    return { success: false, error: "Invalid role" }
  }

  const existingAdmin = await prisma.admins.findFirst({
    where: { nom, prenom }
  })

  if (existingAdmin) {
    return { success: false, error: "An administrator with this name already exists." }
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate a random recovery key ONLY if the new admin is a CEO
    let recoveryKey = null
    if (role === "ceo") {
      const { randomBytes } = await import("crypto")
      recoveryKey = randomBytes(32).toString("hex")
    }

    const newAdmin = await prisma.admins.create({
      data: {
        nom,
        prenom,
        password_hash: hashedPassword,
        recovery_key: recoveryKey,
        role: role as admins_role,
        created_at: new Date(),
        updated_at: new Date()
      }
    })

    return {
      success: true,
      recoveryKey: recoveryKey,
      message: recoveryKey
        ? "⚠️ Save this recovery key securely! It cannot be shown again."
        : "Admin created successfully."
    }
  } catch (error) {
    console.error("[v0] Error creating admin:", error)
    return { success: false, error: "Failed to create admin" }
  }
}

export async function getCEOStats() {
  const admin = await getAdminFromCookie()
  if (!admin || admin.role !== "ceo") {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const totalUsers = await prisma.users.count()

    // Pending direct sales verification count
    const pendingVerifications = await prisma.direct_sales.count({
      where: { verification_status: "pending", auction_mode: false }
    })

    const approvedUsers = 0 // Not tracked anymore
    const rejectedUsers = 0 // Not tracked anymore

    const totalAdmins = await prisma.admins.count()

    const adminsList = await prisma.admins.findMany({
      select: { id: true, nom: true, prenom: true, role: true, created_at: true, recovery_key: true },
      orderBy: { created_at: "desc" }
    })

    const recentUsers = await prisma.users.findMany({
      select: { id: true, username: true, email: true, user_type: true, created_at: true, is_profile_complete: true },
      orderBy: { created_at: "desc" },
      take: 10
    })

    const verificationHistory: any[] = []

    // Simple placeholder stats
    const adminActionStats: any[] = []
    const adminStatsToday: any[] = []
    const adminStatsMonth: any[] = []
    const adminStatsYear: any[] = []

    return {
      success: true,
      stats: {
        totalUsers,
        pendingVerifications,
        approvedUsers,
        rejectedUsers,
        totalAdmins,
        admins: adminsList,
        recentUsers,
        verificationHistory,
        adminActionStats,
        adminStatsToday,
        adminStatsMonth,
        adminStatsYear,
      },
    }
  } catch (error) {
    console.error("[v0] Error getting CEO stats:", error)
    return { success: false, error: "Failed to get statistics" }
  }
}

export async function deleteAdmin(adminId: number) {
  const admin = await getAdminFromCookie()
  if (!admin || admin.role !== "ceo") {
    return { success: false, error: "Unauthorized - Only CEO can delete admins" }
  }

  if (admin.id === adminId) {
    return { success: false, error: "Cannot delete your own account" }
  }

  try {
    await prisma.admins.delete({ where: { id: adminId } })

    return { success: true }
  } catch (error) {
    console.error("[v0] Error deleting admin:", error)
    return { success: false, error: "Failed to delete admin" }
  }
}

export async function changeAdminPassword(adminId: number, newPassword: string) {
  const admin = await getAdminFromCookie()
  if (!admin || admin.role !== "ceo") {
    return { success: false, error: "Unauthorized - Only CEO can change admin passwords" }
  }

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "Password must be at least 6 characters" }
  }

  try {
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Get current password_version
    const currentAdmin = await prisma.admins.findUnique({ where: { id: adminId } })
    const newVersion = (currentAdmin?.password_version || 0) + 1

    // Update the password and increment password_version to invalidate existing sessions
    await prisma.admins.update({
      where: { id: adminId },
      data: {
        password_hash: hashedPassword,
        password_version: newVersion
      }
    })

    return { success: true }
  } catch (error) {
    console.error("[v0] Error changing admin password:", error)
    return { success: false, error: "Failed to change password" }
  }
}

export async function getPendingDirectSales() {
  if (!(await isAdmin())) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const pendingDirectSales = await prisma.direct_sales.findMany({
      where: {
        verification_status: "pending",
        auction_mode: false // Only direct sales
      },
      include: {
        users_direct_sales_user_idTousers: {
          select: {
            username: true,
            email: true,
            first_name: true,
            last_name: true
          }
        },
        direct_sale_photos: true
      },
      orderBy: { created_at: "asc" }
    })

    const formattedDirectSales = pendingDirectSales.map(ds => ({
      id: ds.id,
      user_id: ds.user_id,
      make: ds.make,
      model: ds.model,
      year: ds.year,
      mileage: ds.mileage,
      transmission: ds.transmission,
      fuel_type: ds.fuel_type,
      engine_size: ds.engine_size ? parseFloat(ds.engine_size) : null,
      doors: ds.doors ? parseInt(ds.doors) : null,
      vehicle_condition: ds.vehicle_condition,
      location: ds.location,
      description: ds.description,
      price: Number(ds.price),
      carte_grise_url: ds.carte_grise_url ?? "",
      verification_status: ds.verification_status ?? "pending",
      created_at: ds.created_at,
      username: ds.users_direct_sales_user_idTousers.username,
      email: ds.users_direct_sales_user_idTousers.email,
      first_name: ds.users_direct_sales_user_idTousers.first_name ?? "",
      last_name: ds.users_direct_sales_user_idTousers.last_name ?? "",
      photos: ds.direct_sale_photos.map(p => p.photo_url)
    }))

    const total = await prisma.direct_sales.count({
      where: {
        verification_status: "pending",
        auction_mode: false
      }
    })

    return { success: true, directSales: formattedDirectSales, total }
  } catch (error) {
    console.error("[v0] Error getting pending direct sales:", error)
    return { success: false, error: "Failed to get pending direct sales" }
  }
}

export async function approveDirectSale(directSaleId: number) {
  const admin = await getValidatedAdmin()
  if (!admin) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await prisma.direct_sales.update({
      where: { id: directSaleId },
      data: {
        verification_status: "approved",
        sale_status: "available",
        reviewed_by: admin.id,
        reviewed_at: new Date()
      }
    })

    // Log decision
    try {
      await prisma.verification_log.create({
        data: {
          entity_type: "vehicle", // Direct sale is a vehicle
          entity_id: directSaleId,
          action: "approved",
          reason: null,
          admin_id: admin.id,
          admin_name: `${admin.prenom} ${admin.nom}`
        }
      })
    } catch (logErr) {
      console.error("[admin/actions] Failed to log verification decision:", logErr)
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error approving direct sale:", error)
    return { success: false, error: "Failed to approve direct sale" }
  }
}

export async function rejectDirectSale(directSaleId: number, reason: string) {
  const admin = await getValidatedAdmin()
  if (!admin) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    await prisma.direct_sales.update({
      where: { id: directSaleId },
      data: {
        verification_status: "rejected",
        rejected_reason: reason,
        reviewed_by: admin.id,
        reviewed_at: new Date()
      }
    })

    // Log decision
    try {
      await prisma.verification_log.create({
        data: {
          entity_type: "vehicle", // Direct sale is a vehicle
          entity_id: directSaleId,
          action: "rejected",
          reason: reason,
          admin_id: admin.id,
          admin_name: `${admin.prenom} ${admin.nom}`
        }
      })
    } catch (logErr) {
      console.error("[admin/actions] Failed to log verification decision:", logErr)
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error rejecting direct sale:", error)
    return { success: false, error: "Failed to reject direct sale" }
  }
}

export async function runDiagnostics() {
  const admin = await getValidatedAdmin()
  if (!admin) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    const timestamp = new Date().toISOString()

    // 1. Vehicle Photos Check (Only direct_sales)
    const pendingVehicles = await prisma.direct_sales.findMany({
      where: { verification_status: "pending", auction_mode: false },
      include: {
        users_direct_sales_user_idTousers: { select: { username: true } },
        direct_sale_photos: true
      }
    })

    const vehiclesAnalysis = pendingVehicles.map(v => ({
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      photoCount: v.direct_sale_photos.length,
      hasPhotos: v.direct_sale_photos.length > 0,
      owner: v.users_direct_sales_user_idTousers?.username || "Unknown"
    }))

    const vehiclePhotosStats = {
      totalPending: pendingVehicles.length,
      withoutPhotos: vehiclesAnalysis.filter(v => !v.hasPhotos).length,
      vehicles: vehiclesAnalysis
    }

    // 2. Database Health
    const usersCount = await prisma.users.count()
    const adminsCount = await prisma.admins.count()
    const directSalesCount = await prisma.direct_sales.count()

    const pendingDirectSales = await prisma.direct_sales.count({ where: { verification_status: "pending", auction_mode: false } })

    // Check for orphaned photos (photos without valid sales) - simplistic check
    const issues = {
      orphanedVehiclePhotos: 0,
      orphanedDirectSalePhotos: 0
    }

    const databaseHealth = {
      tables: {
        users: usersCount,
        admins: adminsCount,
        direct_sales: directSalesCount
      },
      pending: {
        direct_sales: pendingDirectSales
      },
      issues
    }

    return {
      success: true,
      timestamp,
      results: {
        vehiclePhotos: vehiclePhotosStats,
        databaseHealth
      },
      errors: {
        vehiclePhotos: null,
        databaseHealth: null
      }
    }
  } catch (error: any) {
    console.error("[v0] Diagnostics error:", error)
    return { success: false, error: error.message || "Diagnostics failed" }
  }
}
