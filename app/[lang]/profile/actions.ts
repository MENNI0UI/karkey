"use server"

import prisma from "@/lib/prisma"
import { verifyToken } from "@/lib/mysql-auth" // used to decode token for userId

export async function getUserProfile(userId: number) {
  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        first_name: true,
        last_name: true,
        phone_number: true,
        user_type: true,
        profile_picture: true,
        is_profile_complete: true,
        created_at: true,
        updated_at: true
      }
    })

    if (!user) {
      return null
    }



    const profileData = {
      id: user.id,
      username: user.username,
      first_name: user.first_name || null,
      last_name: user.last_name || null,
      email: user.email,
      phone_number: user.phone_number,
      user_type: user.user_type,
      profile_picture: user.profile_picture,
      is_profile_complete: user.is_profile_complete,
      created_at: user.created_at,
      updated_at: user.updated_at,
    }

    return profileData
  } catch (error) {
    console.error("[v0] ❌ Error fetching user profile:", error)
    console.error("[v0] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return null
  }
}

export async function getUserAuctions(userId: number) {
  try {
    // 🆕 النظام الجديد: المزادات الآن في direct_sales مع auction_mode
    const auctions = await prisma.direct_sales.findMany({
      where: {
        user_id: userId,
        auction_mode: true,
      },
      include: {
        direct_sale_photos: {
          orderBy: { position_order: "asc" },
          take: 1
        }
      },
      orderBy: { created_at: "desc" }
    })

    console.log(`[v0] getUserAuctions: fetched ${auctions.length} rows for userId=${userId}`)

    const now = new Date()
    const result = auctions.map((a) => {
      const title = [a.make, a.model].filter(Boolean).join(" ").trim()
      const imageUrl = a.direct_sale_photos?.[0]?.photo_url ?? null

      // تحديد الحالة
      let effectiveStatus: string = a.auction_status ?? "none"
      if (a.verification_status === "rejected") {
        effectiveStatus = "cancelled"
      }

      return {
        id: a.id,
        title: title || "Unknown Vehicle",
        starting_price: a.auction_starting_price ? Number(a.auction_starting_price) : null,
        startingPrice: a.auction_starting_price ? Number(a.auction_starting_price) : null,
        current_price: a.auction_current_bid ? Number(a.auction_current_bid) : null,
        image_url: imageUrl,
        status: effectiveStatus,
        start_date: a.auction_start_date,
        end_date: a.auction_end_date,
        vehicle_id: a.id,
        created_at: a.created_at,
        type: "auction"
      }
    })

    return { success: true, auctions: result }
  } catch (error) {
    console.error("[v0] Error fetching user auctions:", error)
    return { success: false, error: "Failed to fetch auctions", auctions: [] }
  }
}

export async function updateProfilePicture(userId: number, profilePictureUrl: string) {
  try {
    await prisma.users.update({
      where: { id: userId },
      data: {
        profile_picture: profilePictureUrl,
        updated_at: new Date()
      }
    })

    return { success: true }
  } catch (error: any) {
    console.error("[v0] ========== updateProfilePicture ERROR ==========")
    console.error("[v0] ❌ Error updating profile picture:", error)
    console.error("[v0] Error message:", error.message)
    console.error("[v0] Error code:", error.code)
    console.error("[v0] Error stack:", error.stack)

    // Check if it's a column not found error
    if (error.message && error.message.includes("profile_picture")) {
      console.error("[v0] ⚠️ The 'profile_picture' column doesn't exist in the users table")
      console.error("[v0] Please run: npm run db:add-profile-picture")
      return {
        success: false,
        error: "Database not configured. Please run: npm run db:add-profile-picture",
      }
    }

    return { success: false, error: "Failed to update profile picture" }
  }
}

export async function updateUserProfile(userId: number, data: { email?: string, phone_number?: string }) {
  try {
    await prisma.users.update({
      where: { id: userId },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.phone_number && { phone_number: data.phone_number }),
        updated_at: new Date()
      }
    })

    return { success: true }
  } catch (error: any) {
    console.error("[v0] ========== updateUserProfile ERROR ==========")
    console.error("[v0] ❌ Error updating user profile:", error)
    return { success: false, error: "Failed to update profile information" }
  }
}

export async function checkEmailAvailability(email: string) {
  try {
    const existingUser = await prisma.users.findFirst({
      where: {
        email: email,
      },
      select: { id: true },
    })

    if (existingUser) {
      return { available: false, error: "Email already taken" }
    }

    return { available: true }
  } catch (error) {
    console.error("[v0] Error checking email availability:", error)
    return { available: false, error: "Failed to check email availability" }
  }
}

export async function logoutUser() {
  try {
    const { cookies } = await import("next/headers")
    const cookieStore = await cookies()

    // Debug: log which cookies server sees in this request
    try {
      const authTokenCookie = cookieStore.get("auth_token")?.value ?? null
      const refreshTokenCookie = cookieStore.get("refresh_token")?.value ?? null
      const sessionCookie = cookieStore.get("session")?.value ?? cookieStore.get("sid")?.value ?? null
      console.debug("[logoutUser] cookieStore auth_token present:", Boolean(authTokenCookie))
      console.debug("[logoutUser] cookieStore refresh_token present:", Boolean(refreshTokenCookie))
      console.debug("[logoutUser] cookieStore session/sid present:", Boolean(sessionCookie))
    } catch (inner) {
      console.debug("[logoutUser] unable to read individual cookies from cookieStore:", inner)
    }

    // Attempt: if auth_token exists, try to verify and remove refresh tokens in DB for that user
    try {
      const authToken = cookieStore.get("auth_token")?.value ?? null
      if (authToken) {
        try {
          const payload: any = await verifyToken(authToken).catch(() => null)
          if (payload && typeof payload.userId === "number") {
            const uid = payload.userId
            try {
              // best-effort: delete refresh tokens for this user if table exists
              await prisma.$executeRawUnsafe('DELETE FROM refresh_tokens WHERE user_id = ?', uid)
              console.debug(`[logoutUser] deleted refresh_tokens rows for userId=${uid}`)
            } catch (dbErr) {
              const msg = typeof dbErr === "object" && dbErr && "message" in dbErr && typeof (dbErr as any).message === "string"
                ? (dbErr as any).message
                : String(dbErr)
              console.warn("[logoutUser] failed to delete refresh_tokens (maybe table missing):", msg)
            }
          } else {
            console.debug("[logoutUser] verifyToken did not return a numeric userId")
          }
        } catch (vErr) {
          console.warn("[logoutUser] token verify failed:", vErr)
        }
      } else {
        console.debug("[logoutUser] no auth_token cookie found to verify")
      }
    } catch (payloadErr) {
      console.warn("[logoutUser] error during token->userId handling:", payloadErr)
    }

    // Attempt to remove server-side session rows - use raw queries for best-effort cleanup
    try {
      const sess = cookieStore.get("session")?.value ?? cookieStore.get("sid")?.value ?? cookieStore.get("connect.sid")?.value ?? null
      if (sess) {
        // best-effort cleanup of session tables using raw queries
        try {
          await prisma.$executeRawUnsafe("DELETE FROM sessions WHERE sid = ?", sess)
        } catch { /* ignore */ }
        try {
          await prisma.$executeRawUnsafe("DELETE FROM session_store WHERE session_id = ?", sess)
        } catch { /* ignore */ }
        try {
          await prisma.$executeRawUnsafe("DELETE FROM connect_sessions WHERE sid = ?", sess)
        } catch { /* ignore */ }
        try {
          await prisma.$executeRawUnsafe("DELETE FROM refresh_tokens WHERE session_id = ?", sess)
        } catch { /* ignore */ }
        console.debug("[logoutUser] attempted session-store cleanup")
      } else {
        console.debug("[logoutUser] no session cookie found to cleanup server-side")
      }
    } catch (sessErr) {
      console.warn("[logoutUser] server-side session cleanup attempt failed:", sessErr)
    }

    // Finally, delete the cookie from cookieStore
    try {
      cookieStore.delete("auth_token")
      cookieStore.delete("refresh_token")
      // log after deletion attempt

    } catch (delErr) {

    }

    return { success: true }
  } catch (error) {
    console.error("[v0] Error logging out:", error)
    return { success: false, error: "Failed to logout" }
  }
}

export async function getWatchlistForUser(userId: number) {
  try {
    // 🆕 النظام الجديد: المزادات الآن في direct_sales_watchlist مع auction_mode
    // نستخدم direct_sales_watchlist بدلاً من watchlist القديم
    const watchlistItems = await prisma.direct_sales_watchlist.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" }
    })

    if (watchlistItems.length === 0) return []

    // Get direct sales with auction_mode for these watchlist items
    const directSaleIds = watchlistItems.map(w => w.direct_sale_id)
    const directSales = await prisma.direct_sales.findMany({
      where: {
        id: { in: directSaleIds },
        auction_mode: true
      },
      include: {
        direct_sale_photos: {
          orderBy: { position_order: "asc" },
          take: 1
        }
      }
    })

    const dsMap = new Map(directSales.map(ds => [ds.id, ds]))

    return watchlistItems
      .filter(w => dsMap.has(w.direct_sale_id))
      .map((w) => {
        const ds = dsMap.get(w.direct_sale_id)!
        const title = [ds.make, ds.model].filter(Boolean).join(" ").trim()
        const imageUrl = ds.direct_sale_photos?.[0]?.photo_url ?? null
        const sp = ds.auction_starting_price ? Number(ds.auction_starting_price) : null

        let effectiveStatus: string = ds.auction_status ?? "none"
        if (ds.verification_status === "rejected") {
          effectiveStatus = "cancelled"
        }

        return {
          id: ds.id,
          title: title || "",
          starting_price: sp,
          startingPrice: sp,
          current_price: ds.auction_current_bid ? Number(ds.auction_current_bid) : null,
          image_url: imageUrl,
          status: effectiveStatus,
          end_date: ds.auction_end_date ?? null,
        }
      })
  } catch (err) {
    console.error("[v0] Error fetching watchlist:", err)
    return []
  }
}

export async function getDirectSalesWatchlistForUser(userId: number) {
  try {
    // Get watchlist items
    const watchlistItems = await prisma.direct_sales_watchlist.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" }
    })

    if (watchlistItems.length === 0) return []

    // Get direct sales with photos for these watchlist items
    const directSaleIds = watchlistItems.map(w => w.direct_sale_id)
    const directSales = await prisma.direct_sales.findMany({
      where: { id: { in: directSaleIds } },
      include: {
        direct_sale_photos: {
          orderBy: { position_order: "asc" }
        }
      }
    })

    // Create a map for quick lookup
    const dsMap = new Map(directSales.map(ds => [ds.id, ds]))

    return watchlistItems.map((w) => {
      const ds = dsMap.get(w.direct_sale_id)
      const title = ds ? [ds.make, ds.model].filter(Boolean).join(" ").trim() : ""
      const imageUrl = ds?.direct_sale_photos?.[0]?.photo_url ?? null

      // Normalize status
      let effectiveStatus: string = ds?.verification_status ?? "pending"
      if (ds?.sale_status === "sold") {
        effectiveStatus = "completed"
      } else if (ds?.sale_status === "available" && effectiveStatus === "approved") {
        effectiveStatus = "active"
      }

      return {
        id: ds?.id ?? w.id,
        title: title || "Unknown Vehicle",
        starting_price: ds?.price ? Number(ds.price) : null,
        startingPrice: ds?.price ? Number(ds.price) : null,
        current_price: null,
        image_url: imageUrl,
        status: effectiveStatus,
        created_at: ds?.created_at ?? w.created_at,
        type: "direct_sale"
      }
    })
  } catch (err) {
    console.error("[v0] Error fetching direct sales watchlist:", err)
    return []
  }
}

export async function getUserDirectSales(userId: number) {
  try {
    const directSales = await prisma.direct_sales.findMany({
      where: { user_id: userId },
      include: {
        direct_sale_photos: {
          orderBy: { position_order: "asc" },
          take: 1
        }
      },
      orderBy: { created_at: "desc" }
    })

    const result = directSales.map((ds) => {
      const title = [ds.make, ds.model].filter(Boolean).join(" ").trim()
      const imageUrl = ds.direct_sale_photos?.[0]?.photo_url ?? null

      // Normalize status: if it's sold it should show as ended/sold.
      // If it's not approved yet, it stays pending.
      let effectiveStatus: string = ds.verification_status ?? "pending"
      if (ds.sale_status === "sold") {
        effectiveStatus = "completed"
      } else if (ds.sale_status === "available" && effectiveStatus === "approved") {
        effectiveStatus = "active"
      }

      return {
        id: ds.id,
        title: title || "Unknown Vehicle",
        starting_price: ds.price ? Number(ds.price) : null,
        startingPrice: ds.price ? Number(ds.price) : null,
        current_price: null,
        image_url: imageUrl,
        status: effectiveStatus,
        start_date: ds.created_at,
        end_date: null,
        vehicle_id: null,
        created_at: ds.created_at,
        type: "direct_sale"
      }
    })

    return { success: true, directSales: result }
  } catch (error) {
    console.error("[v0] Error fetching user direct sales:", error)
    return { success: false, error: "Failed to fetch direct sales", directSales: [] }
  }
}

export async function getUserStatistics(userId: number) {
  try {
    // 1. Fetch all user's direct sales with details (excluding views to avoid type error)
    // We cast to any for the select because direct_sale_photos might also be missing in types if out of sync
    const directSales = await prisma.direct_sales.findMany({
      where: { user_id: userId },
      select: {
        id: true,
        make: true,
        model: true,
        year: true,
        price: true,
        sale_status: true,
        verification_status: true,
        created_at: true,
        direct_sale_photos: {
          select: { photo_url: true },
          orderBy: { position_order: "asc" },
          take: 1,
        },
      } as any,
      orderBy: { created_at: "desc" },
    });

    const directSaleIds = directSales.map((ds: any) => ds.id);

    // 2. Fetch Views using Raw Query (bypass type issues)
    const viewsMap: Record<number, number> = {};
    if (directSaleIds.length > 0) {
      try {
        const viewsResult = await prisma.$queryRaw<{ id: number, views: number }[]>`
          SELECT id, views FROM direct_sales WHERE user_id = ${userId}
        `;
        // Ensure result is array
        if (Array.isArray(viewsResult)) {
          viewsResult.forEach((row: any) => {
            viewsMap[row.id] = row.views || 0;
          });
        }
      } catch (e) {
        console.error("Error fetching specific views", e);
      }
    }

    // 3. Count saves per listing
    const watchlistCounts: Record<number, number> = {};
    if (directSaleIds.length > 0) {
      const saves = await prisma.direct_sales_watchlist.groupBy({
        by: ["direct_sale_id"],
        where: { direct_sale_id: { in: directSaleIds } },
        _count: { direct_sale_id: true },
      });
      saves.forEach((s) => {
        watchlistCounts[s.direct_sale_id] = s._count.direct_sale_id;
      });
    }

    // 4. Count contacts per listing
    const contactsCounts: Record<number, number> = {};
    if (directSaleIds.length > 0) {
      const contacts = await prisma.direct_sales_contacts.groupBy({
        by: ["direct_sale_id"],
        where: {
          direct_sale_id: { in: directSaleIds.map((id: number) => BigInt(id)) },
        },
        _count: { direct_sale_id: true },
      });
      contacts.forEach((c) => {
        contactsCounts[Number(c.direct_sale_id)] = c._count.direct_sale_id;
      });
    }

    // 5. Aggregate Totals
    const totalViews = Object.values(viewsMap).reduce((sum, v) => sum + v, 0);
    const totalSaves = Object.values(watchlistCounts).reduce((sum, count) => sum + count, 0);
    const totalContacts = Object.values(contactsCounts).reduce((sum, count) => sum + count, 0);

    const activeListings = directSales.filter(
      (ds: any) => ds.sale_status === "available" && ds.verification_status === "approved"
    ).length;
    const soldListings = directSales.filter((ds: any) => ds.sale_status === "sold").length;
    const approvedListings = directSales.filter(
      (ds: any) => ds.verification_status === "approved"
    ).length;
    const pendingListings = directSales.filter(
      (ds: any) => ds.verification_status === "pending"
    ).length;

    // 6. Build detailed listing performance array
    const listingPerformance = directSales.map((ds: any) => ({
      id: ds.id,
      title: `${ds.make} ${ds.model} ${ds.year}`,
      image_url: ds.direct_sale_photos?.[0]?.photo_url || null,
      price: ds.price ? Number(ds.price) : 0,
      status: ds.sale_status === 'sold' ? 'Sold' : (ds.verification_status === 'approved' ? 'Active' : 'Pending'),
      views: viewsMap[ds.id] || 0,
      saves: watchlistCounts[ds.id] || 0,
      contacts: contactsCounts[ds.id] || 0,
      created_at: ds.created_at,
    }));

    return {
      success: true,
      statistics: {
        totalViews,
        totalSaves,
        totalContacts,
        activeListings,
        soldListings,
        approvedListings,
        pendingListings,
        totalListings: directSales.length,
        listingPerformance,
      },
    };
  } catch (error) {
    console.error("[v0] Error fetching user statistics:", error);
    return {
      success: false,
      error: "Failed to fetch statistics",
      statistics: {
        totalViews: 0,
        totalSaves: 0,
        totalContacts: 0,
        activeListings: 0,
        soldListings: 0,
        approvedListings: 0,
        pendingListings: 0,
        totalListings: 0,
        listingPerformance: [],
      },
    };
  }
}

