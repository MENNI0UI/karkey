"use server"
import prisma from "@/lib/prisma"
import { createAdminToken, setAdminCookie, getAdminFromCookie, verifyAdminSession, clearAdminCookie } from "@/lib/admin-auth"
import bcrypt from "bcryptjs"

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

export async function getAdminSession() {
  const admin = await getValidatedAdmin()
  if (!admin) {
    return { success: false, error: "Not authenticated" }
  }
  return {
    success: true,
    admin: {
      id: admin.id,
      nom: admin.nom,
      prenom: admin.prenom,
      role: admin.role
    }
  }
}

export async function adminLogout() {
  await clearAdminCookie()
  return { success: true }
}

// User verification functions removed

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
        role: role as "ceo" | "verification" | "finance" | "support",
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
    const totalAdmins = await prisma.admins.count()

    const adminsList = await prisma.admins.findMany({
      select: { id: true, nom: true, prenom: true, role: true, created_at: true, recovery_key: true },
      orderBy: { created_at: "desc" }
    })

    // User verifications removed, using basic selection
    const recentUsers = await prisma.users.findMany({
      select: { id: true, username: true, email: true, user_type: true, created_at: true, is_profile_complete: true },
      orderBy: { created_at: "desc" },
      take: 10
    })

    // Get verification history - Direct Sales ONLY (replaces vehicles)
    const verificationHistory = await prisma.$queryRaw`
      SELECT 
          'vehicle' as entity_type,
          ds.id as entity_id,
          CONVERT(CONCAT(ds.make, ' ', ds.model, ' ', ds.year) USING utf8mb4) as entity_name,
          NULL as cin_number,
          CONVERT(ds.verification_status USING utf8mb4) as action,
          NULL as reason,
          COALESCE(CONCAT(ad.prenom, ' ', ad.nom), 'Unknown') as admin_name,
          ds.updated_at as created_at
        FROM direct_sales ds
        LEFT JOIN admins ad ON ds.reviewed_by = ad.id
        WHERE ds.verification_status IN ('approved', 'rejected')
      ORDER BY created_at DESC
      LIMIT 50`

    // Get stats per admin (counts of approvals/rejections) - ALL TIME
    const adminActionStats = await prisma.$queryRaw`
      SELECT admin_name, action, COUNT(*) as count FROM (
        SELECT
          COALESCE(CONCAT(ad.prenom, ' ', ad.nom), 'Unknown') AS admin_name,
          CONVERT(ds.verification_status USING utf8mb4) AS action,
          ds.updated_at AS action_date
        FROM direct_sales ds
        LEFT JOIN admins ad ON ds.reviewed_by = ad.id
        WHERE ds.verification_status IN ('approved', 'rejected')
      ) all_time
      GROUP BY admin_name, action`

    // Get stats per admin - TODAY
    const adminStatsToday = await prisma.$queryRaw`
      SELECT admin_name, action, COUNT(*) as count FROM (
        SELECT
          COALESCE(CONCAT(ad.prenom, ' ', ad.nom), 'Unknown') AS admin_name,
          CONVERT(ds.verification_status USING utf8mb4) AS action,
          ds.updated_at AS action_date
        FROM direct_sales ds
        LEFT JOIN admins ad ON ds.reviewed_by = ad.id
        WHERE ds.verification_status IN ('approved', 'rejected')
      ) today
      WHERE DATE(action_date) = CURDATE()
      GROUP BY admin_name, action`

    // Get stats per admin - THIS MONTH
    const adminStatsMonth = await prisma.$queryRaw`
      SELECT admin_name, action, COUNT(*) as count FROM (
        SELECT
          COALESCE(CONCAT(ad.prenom, ' ', ad.nom), 'Unknown') AS admin_name,
          CONVERT(ds.verification_status USING utf8mb4) AS action,
          ds.updated_at AS action_date
        FROM direct_sales ds
        LEFT JOIN admins ad ON ds.reviewed_by = ad.id
        WHERE ds.verification_status IN ('approved', 'rejected')
      ) month_stats
      WHERE YEAR(action_date) = YEAR(CURDATE()) AND MONTH(action_date) = MONTH(CURDATE())
      GROUP BY admin_name, action`

    // Get stats per admin - THIS YEAR
    const adminStatsYear = await prisma.$queryRaw`
      SELECT admin_name, action, COUNT(*) as count FROM (
        SELECT
          COALESCE(CONCAT(ad.prenom, ' ', ad.nom), 'Unknown') AS admin_name,
          CONVERT(ds.verification_status USING utf8mb4) AS action,
          ds.updated_at AS action_date
        FROM direct_sales ds
        LEFT JOIN admins ad ON ds.reviewed_by = ad.id
        WHERE ds.verification_status IN ('approved', 'rejected')
      ) year_stats
      WHERE YEAR(action_date) = YEAR(CURDATE())
      GROUP BY admin_name, action`

    return {
      success: true,
      stats: {
        totalUsers,
        totalAdmins,
        admins: adminsList,
        recentUsers,
        verificationHistory: Array.isArray(verificationHistory) ? verificationHistory : [],
        adminActionStats: Array.isArray(adminActionStats) ? adminActionStats : [],
        adminStatsToday: Array.isArray(adminStatsToday) ? adminStatsToday : [],
        adminStatsMonth: Array.isArray(adminStatsMonth) ? adminStatsMonth : [],
        adminStatsYear: Array.isArray(adminStatsYear) ? adminStatsYear : [],
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

// ============================================
// 🆕 النظام الجديد: لا يوجد vehicles table بشكل منفصل
// كل شيء الآن في direct_sales مع auction_mode للمزادات
// ============================================

// ============================================
// Direct Sales Verification Functions
// ============================================

export async function getPendingDirectSales() {
  const admin = await getAdminFromCookie()
  if (!admin || (admin.role !== "verification" && admin.role !== "ceo")) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    console.log("[v0 SERVER] Fetching pending direct sales...")

    const pendingDirectSales = await prisma.direct_sales.findMany({
      where: { verification_status: "pending" },
      include: {
        users_direct_sales_user_idTousers: {
          select: {
            username: true,
            email: true,
            first_name: true,
            last_name: true
          }
        },
        direct_sale_photos: {
          orderBy: { position_order: "asc" }
        }
      },
      orderBy: { created_at: "asc" }
    })

    // Transform to expected format
    const directSalesWithPhotos = pendingDirectSales.map(ds => {
      // Combine vehicle photos with service_history_url (optional documents)
      const photos = ds.direct_sale_photos?.map(p => p.photo_url).filter(Boolean) ?? [];
      // Only add service_history_url if it's not already in photos (backward compatibility for old listings)
      if (ds.service_history_url && !photos.includes(ds.service_history_url)) {
        photos.push(ds.service_history_url);
      }
      return {
        id: ds.id,
        user_id: ds.user_id,
        make: ds.make,
        model: ds.model,
        year: ds.year,
        mileage: ds.mileage,
        transmission: ds.transmission,
        fuel_type: ds.fuel_type,
        engine_size: ds.engine_size ?? null,
        doors: ds.doors ?? null,
        vehicle_condition: ds.vehicle_condition,
        location: ds.location,
        description: ds.description,
        special_features: ds.special_features,
        price: ds.price,
        carte_grise_url: ds.carte_grise_url,
        service_history_url: ds.service_history_url,
        verification_status: ds.verification_status,
        created_at: ds.created_at,
        username: ds.users_direct_sales_user_idTousers?.username,
        email: ds.users_direct_sales_user_idTousers?.email,
        first_name: ds.users_direct_sales_user_idTousers?.first_name,
        last_name: ds.users_direct_sales_user_idTousers?.last_name,
        photos
      };
    })

    console.log("[v0 SERVER] Found", directSalesWithPhotos.length, "pending direct sale(s)")

    // Get total count
    const totalPending = await prisma.direct_sales.count({
      where: { verification_status: "pending" }
    })

    return { success: true, directSales: directSalesWithPhotos, total: totalPending }
  } catch (error) {
    console.error("[v0 SERVER] Error getting pending direct sales:", error)
    return { success: false, error: "Failed to get pending direct sales" }
  }
}

export async function approveDirectSale(directSaleId: number) {
  const admin = await getValidatedAdmin()
  if (!admin || (admin.role !== "verification" && admin.role !== "ceo")) {
    return { success: false, error: "Unauthorized" }
  }

  try {
    // Update direct sale status
    await prisma.direct_sales.update({
      where: { id: directSaleId },
      data: {
        verification_status: "approved",
        reviewed_by: admin.id,
        reviewed_at: new Date(),
        updated_at: new Date()
      }
    })

    // Log the decision
    try {
      await prisma.verification_log.create({
        data: {
          entity_type: "vehicle",
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

    // Create notification for user
    const directSale = await prisma.direct_sales.findUnique({
      where: { id: directSaleId },
      include: { users_direct_sales_user_idTousers: true }
    })

    if (directSale) {
      const vehicleLabel = `${directSale.year} ${directSale.make} ${directSale.model}`;
      await prisma.notifications.create({
        data: {
          user_id: directSale.user_id,
          title: `__t:notifications.direct_sale_approved_title`,
          message: `__t:notifications.direct_sale_approved_message|vehicle=${vehicleLabel}`,
          type: "success",
          created_at: new Date()
        }
      })
    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error approving direct sale:", error)
    return { success: false, error: "Failed to approve direct sale" }
  }
}

export async function rejectDirectSale(directSaleId: number, reason: string) {
  const admin = await getValidatedAdmin()
  if (!admin || (admin.role !== "verification" && admin.role !== "ceo")) {
    return { success: false, error: "Unauthorized" }
  }

  if (!reason || reason.trim().length === 0) {
    return { success: false, error: "Rejection reason is required" }
  }

  try {
    // Get direct sale and user info
    const directSale = await prisma.direct_sales.findUnique({
      where: { id: directSaleId },
      include: { users_direct_sales_user_idTousers: true }
    })

    if (!directSale) {
      return { success: false, error: "Direct sale not found" }
    }

    // Update direct sale status
    await prisma.direct_sales.update({
      where: { id: directSaleId },
      data: {
        verification_status: "rejected",
        rejected_reason: reason,
        reviewed_by: admin.id,
        reviewed_at: new Date(),
        updated_at: new Date()
      }
    })

    // Log the decision
    try {
      await prisma.verification_log.create({
        data: {
          entity_type: "vehicle",
          entity_id: directSaleId,
          action: "rejected",
          reason,
          admin_id: admin.id,
          admin_name: `${admin.prenom} ${admin.nom}`
        }
      })
    } catch (logErr) {
      console.error("[admin/actions] Failed to log verification decision:", logErr)
    }

    // Create notification for user
    const vehicleLabel = `${directSale.year} ${directSale.make} ${directSale.model}`;
    await prisma.notifications.create({
      data: {
        user_id: directSale.user_id,
        title: `__t:notifications.direct_sale_rejected_title`,
        message: `__t:notifications.direct_sale_rejected_message|vehicle=${vehicleLabel}|reason=${reason}`,
        type: "error",
        created_at: new Date()
      }
    })

    return { success: true }
  } catch (error) {
    console.error("[v0] Error rejecting direct sale:", error)
    return { success: false, error: "Failed to reject direct sale" }
  }
}

// ============================================
// Diagnostic Tools (CEO Only)
// ============================================

// 🆕 النظام الجديد: فحص صور البيع المباشر/المزاد بدلاً من vehicles القديمة
export async function checkPendingVehiclePhotos() {
  const admin = await getAdminFromCookie()
  if (!admin || admin.role !== "ceo") {
    return { success: false, error: "Unauthorized - CEO only" }
  }

  try {
    const pendingListings = await prisma.direct_sales.findMany({
      where: { verification_status: "pending" },
      include: {
        direct_sale_photos: {
          orderBy: { position_order: "asc" }
        },
        users_direct_sales_user_idTousers: {
          select: { username: true, email: true }
        }
      },
      take: 20
    })

    const results = pendingListings.map(v => ({
      id: v.id,
      make: v.make,
      model: v.model,
      year: v.year,
      auction_mode: v.auction_mode,
      photoCount: v.direct_sale_photos?.length || 0,
      carteGriseUrl: v.carte_grise_url,
      hasPhotos: (v.direct_sale_photos?.length || 0) > 0,
      photos: v.direct_sale_photos?.slice(0, 3).map(p => p.photo_url) || [],
      owner: v.users_direct_sales_user_idTousers?.username || v.users_direct_sales_user_idTousers?.email || "Unknown"
    }))

    const issueCount = results.filter(r => !r.hasPhotos).length

    return {
      success: true,
      data: {
        totalPending: results.length,
        withoutPhotos: issueCount,
        vehicles: results
      }
    }
  } catch (error) {
    console.error("[diagnostic] Error checking listing photos:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function checkDatabaseHealth() {
  const admin = await getAdminFromCookie()
  if (!admin || admin.role !== "ceo") {
    return { success: false, error: "Unauthorized - CEO only" }
  }

  try {
    // 🆕 النظام الجديد: لا يوجد vehicles/auctions/bids - كل شيء في direct_sales
    const [
      usersCount,
      directSalesCount,
      // showroomCount,
      directSalePhotosCount,
      // showroomPhotosCount,
      notificationsCount,
      pendingDirectSales,
      activeAuctions
    ] = await Promise.all([
      prisma.users.count(),
      prisma.direct_sales.count(),
      // prisma.showroom.count(), // Removed
      prisma.direct_sale_photos.count(),
      // prisma.showroom_photos.count(), // Removed
      prisma.notifications.count(),
      prisma.direct_sales.count({ where: { verification_status: "pending" } }),
      prisma.direct_sales.count({ where: { auction_mode: true, auction_status: "active" } })
    ])

    const pendingUsers = 0

    // Check for orphaned photos (photos without a parent)
    // 🆕 النظام الجديد: لا يوجد vehicle_photos - فقط direct_sale_photos و showroom_photos
    const orphanedDirectSalePhotos = await prisma.$queryRaw`
      SELECT COUNT(*) as count FROM direct_sale_photos dp
      LEFT JOIN direct_sales ds ON dp.direct_sale_id = ds.id
      WHERE ds.id IS NULL
    ` as any[]

    return {
      success: true,
      data: {
        tables: {
          users: usersCount,
          directSales: directSalesCount,
          showroom: 0, // showroomCount,
          directSalePhotos: directSalePhotosCount,
          showroomPhotos: 0, // showroomPhotosCount,
          notifications: notificationsCount
        },
        pending: {
          users: pendingUsers,
          directSales: pendingDirectSales,
          auctions: activeAuctions
        },
        issues: {
          orphanedDirectSalePhotos: Number(orphanedDirectSalePhotos[0]?.count || 0)
        }
      }
    }
  } catch (error) {
    console.error("[diagnostic] Error checking database health:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function runDiagnostics() {
  const admin = await getAdminFromCookie()
  if (!admin || admin.role !== "ceo") {
    return { success: false, error: "Unauthorized - CEO only" }
  }

  try {
    const [vehiclePhotosResult, dbHealthResult] = await Promise.all([
      checkPendingVehiclePhotos(),
      checkDatabaseHealth()
    ])

    return {
      success: true,
      timestamp: new Date().toISOString(),
      results: {
        vehiclePhotos: vehiclePhotosResult.success ? vehiclePhotosResult.data : null,
        databaseHealth: dbHealthResult.success ? dbHealthResult.data : null
      },
      errors: {
        vehiclePhotos: vehiclePhotosResult.success ? null : vehiclePhotosResult.error,
        databaseHealth: dbHealthResult.success ? null : dbHealthResult.error
      }
    }
  } catch (error) {
    console.error("[diagnostic] Error running diagnostics:", error)
    return { success: false, error: (error as Error).message }
  }
}
