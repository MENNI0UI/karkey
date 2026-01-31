/**
 * Simple Auction System - نظام مزاد بسيط وآمن
 * 
 * 🎯 الفكرة الأساسية:
 * بدلاً من نسخ البيانات، نستخدم direct_sales نفسه مع "وضع المزاد"
 * 
 * ✅ المميزات:
 * - لا نسخ للبيانات = لا خطر ضياع
 * - تحديث حقل واحد = سرعة فائقة
 * - نفس السيارة تظهر في البيع المباشر والمزاد
 * - لا ضغط على السيرفر
 */

import prisma from "./prisma";

// المنطقة الزمنية المغربية
const MOROCCO_TIMEZONE = 'Africa/Casablanca';

/**
 * الحصول على الوقت الحالي في المغرب
 */
function getMoroccoNow(): Date {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: MOROCCO_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(new Date());
  const get = (type: string) => parts.find(p => p.type === type)?.value || '0';

  return new Date(
    parseInt(get('year')),
    parseInt(get('month')) - 1,
    parseInt(get('day')),
    parseInt(get('hour')),
    parseInt(get('minute')),
    parseInt(get('second'))
  );
}

/**
 * حساب تواريخ نهاية الأسبوع القادم
 */
function getNextWeekendDates(): { startDate: Date; endDate: Date } {
  const now = getMoroccoNow();
  const dayOfWeek = now.getDay();

  // حساب أيام حتى السبت
  let daysUntilSaturday = 6 - dayOfWeek;
  if (daysUntilSaturday < 0) daysUntilSaturday += 7;
  if (daysUntilSaturday === 0 && now.getHours() >= 0) {
    // إذا كان السبت وبدأ، ننتظر للأسبوع القادم
    daysUntilSaturday = 7;
  }

  const startDate = new Date(now);
  startDate.setDate(now.getDate() + daysUntilSaturday);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(startDate.getDate() + 1);
  endDate.setHours(23, 59, 59, 999);

  return { startDate, endDate };
}

// ═══════════════════════════════════════════════════════════════
// 1️⃣ تحضير المزادات (الجمعة 23:55)
// ═══════════════════════════════════════════════════════════════

/**
 * تحضير السيارات المؤهلة للمزاد
 * مجرد تحديث حقول - لا نسخ!
 */
export async function prepareAuctionsForWeekend() {
  const now = new Date();
  const tenDaysAgo = new Date(now);
  tenDaysAgo.setDate(now.getDate() - 10);

  const { startDate, endDate } = getNextWeekendDates();

  // Preparing auctions for weekend

  try {
    // تحديث جماعي - سريع جداً!
    const result = await prisma.direct_sales.updateMany({
      where: {
        verification_status: "approved",
        sale_status: "available",
        auction_consent: true,
        auction_starting_price: { not: null },
        auction_reserve_price: { not: null },
        auction_mode: { not: true }, // لم يدخل المزاد بعد
        created_at: { lt: tenDaysAgo },
      },
      data: {
        auction_mode: true,
        auction_status: "pending",
        auction_start_date: startDate,
        auction_end_date: endDate,
        auction_current_bid: null,
        auction_winner_id: null,
        auction_bid_count: 0,
        updated_at: now,
      },
    });

    // Prepared listings for auction

    // إرسال إشعارات للمستخدمين المتأثرين
    if (result.count > 0) {
      await notifyAuctionPreparation();
    }

    return { success: true, count: result.count };

  } catch (error) {
    console.error('[SimpleAuction] ❌ Error preparing auctions:', error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// 2️⃣ تفعيل المزادات (السبت 00:00:00)
// ═══════════════════════════════════════════════════════════════

/**
 * تفعيل كل المزادات المعلقة
 * UPDATE واحد فقط!
 */
export async function activateAllAuctions() {
  const now = new Date();

  // Activating ALL auctions

  try {
    const result = await prisma.direct_sales.updateMany({
      where: {
        auction_mode: true,
        auction_status: "pending",
        auction_start_date: { lte: now },
      },
      data: {
        auction_status: "active",
        updated_at: now,
      },
    });

    // Activated auctions simultaneously

    return { success: true, count: result.count };

  } catch (error) {
    console.error('[SimpleAuction] ❌ Error activating auctions:', error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// 3️⃣ إنهاء المزادات (الأحد 23:59:59)
// ═══════════════════════════════════════════════════════════════

/**
 * إنهاء كل المزادات وإرجاع غير المباعة
 * 
 * 🎯 قواعد الفوز:
 * - المزاد يعتبر "مكتمل" (completed) فقط إذا:
 *   1. هناك مزايدات
 *   2. أعلى مزايدة >= reserve_price (السعر الاحتياطي)
 * 
 * - المزاد يعتبر "لم يصل للحد الأدنى" (reserve_not_met) إذا:
 *   1. هناك مزايدات
 *   2. لكن أعلى مزايدة < reserve_price
 * 
 * - المزاد يعتبر "بدون مزايدات" (ended_no_bids) إذا:
 *   1. لا توجد مزايدات نهائياً
 */
export async function endAllAuctions() {
  const now = new Date();

  // Ending ALL auctions
  // Rule: Winner only if current_bid >= reserve_price

  try {
    // 1. ✅ المزادات الناجحة: لها مزايدات وأعلى مزايدة >= reserve_price
    // نستخدم raw SQL لأن Prisma updateMany لا تدعم مقارنة حقلين
    const completedResult = await prisma.$executeRaw`
      UPDATE direct_sales 
      SET 
        auction_status = 'completed',
        sale_status = 'reserved',
        updated_at = ${now}
      WHERE 
        auction_mode = true
        AND auction_status = 'active'
        AND auction_end_date <= ${now}
        AND auction_bid_count > 0
        AND auction_current_bid IS NOT NULL
        AND auction_reserve_price IS NOT NULL
        AND auction_current_bid >= auction_reserve_price
    `;

    // 2. ⚠️ المزادات التي لم تصل للحد الأدنى: لها مزايدات لكن < reserve_price
    // ترجع للبيع المباشر
    const reserveNotMetResult = await prisma.$executeRaw`
      UPDATE direct_sales 
      SET 
        auction_mode = false,
        auction_status = 'reserve_not_met',
        sale_status = 'available',
        returned_from_auction_at = ${now},
        updated_at = ${now}
      WHERE 
        auction_mode = true
        AND auction_status = 'active'
        AND auction_end_date <= ${now}
        AND auction_bid_count > 0
        AND auction_current_bid IS NOT NULL
        AND auction_reserve_price IS NOT NULL
        AND auction_current_bid < auction_reserve_price
    `;

    // 3. ❌ المزادات بدون مزايدات نهائياً
    const noBidsResult = await prisma.$executeRaw`
      UPDATE direct_sales 
      SET 
        auction_mode = false,
        auction_status = 'ended_no_bids',
        sale_status = 'available',
        returned_from_auction_at = ${now},
        updated_at = ${now}
      WHERE 
        auction_mode = true
        AND auction_status = 'active'
        AND auction_end_date <= ${now}
        AND (auction_bid_count = 0 OR auction_bid_count IS NULL)
    `;

    // Completed (winner): ${completedResult} auctions
    // Reserve not met: ${reserveNotMetResult} auctions (returned to direct sale)
    // No bids: ${noBidsResult} auctions (returned to direct sale)

    // إشعارات
    const totalEnded = Number(completedResult) + Number(reserveNotMetResult) + Number(noBidsResult);
    if (totalEnded > 0) {
      await notifyAuctionEndings();
    }

    return {
      success: true,
      completed: Number(completedResult),
      reserveNotMet: Number(reserveNotMetResult),
      returned: Number(noBidsResult),
      totalEnded
    };

  } catch (error) {
    console.error('[SimpleAuction] ❌ Error ending auctions:', error);
    return {
      success: false,
      completed: 0,
      reserveNotMet: 0,
      returned: 0,
      totalEnded: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// 🔔 إشعارات
// ═══════════════════════════════════════════════════════════════

async function notifyAuctionPreparation() {
  try {
    const pendingAuctions = await prisma.direct_sales.findMany({
      where: {
        auction_mode: true,
        auction_status: "pending",
      },
      select: {
        id: true,
        user_id: true,
        make: true,
        model: true,
      },
    });

    const notifications = pendingAuctions.map(sale => ({
      user_id: sale.user_id,
      title: `سيارتك ${sale.make} ${sale.model} جاهزة للمزاد`,
      message: 'سيبدأ المزاد يوم السبت عند منتصف الليل.',
      type: 'auction_migration' as const,
      is_read: false,
      created_at: new Date(),
    }));

    if (notifications.length > 0) {
      await prisma.notifications.createMany({ data: notifications });
    }
  } catch (error) {
    console.error('[SimpleAuction] Error sending notifications:', error);
  }
}

async function notifyAuctionEndings() {
  try {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    // 1. إشعار للفائزين (المزادات المكتملة)
    const winners = await prisma.direct_sales.findMany({
      where: {
        auction_status: "completed",
        auction_winner_id: { not: null },
        updated_at: { gte: fiveMinutesAgo },
      },
      select: {
        id: true,
        user_id: true,
        auction_winner_id: true,
        make: true,
        model: true,
        auction_current_bid: true,
      },
    });

    const winnerNotifications = winners.flatMap(sale => [
      // إشعار للفائز
      {
        user_id: sale.auction_winner_id!,
        title: `🎉 مبروك! فزت بمزاد ${sale.make} ${sale.model}`,
        message: `عرضك الفائز: ${sale.auction_current_bid} درهم`,
        type: 'auction_won' as const,
        is_read: false,
        created_at: now,
      },
      // إشعار للبائع
      {
        user_id: sale.user_id,
        title: `✅ تم بيع سيارتك ${sale.make} ${sale.model}`,
        message: `بسعر ${sale.auction_current_bid} درهم. سيتواصل معك الفائز قريباً.`,
        type: 'auction_sold' as const,
        is_read: false,
        created_at: now,
      },
    ]);

    // 2. إشعار للمزادات التي لم تصل للحد الأدنى
    const reserveNotMet = await prisma.direct_sales.findMany({
      where: {
        auction_status: "reserve_not_met",
        updated_at: { gte: fiveMinutesAgo },
      },
      select: {
        id: true,
        user_id: true,
        make: true,
        model: true,
        auction_current_bid: true,
        auction_reserve_price: true,
      },
    });

    const reserveNotMetNotifications = reserveNotMet.map(sale => ({
      user_id: sale.user_id,
      title: `⚠️ سيارتك ${sale.make} ${sale.model} لم تصل للحد الأدنى`,
      message: `أعلى عرض: ${sale.auction_current_bid} درهم، الحد الأدنى: ${sale.auction_reserve_price} درهم. عادت للبيع المباشر.`,
      type: 'auction_reserve_not_met' as const,
      is_read: false,
      created_at: now,
    }));

    // 3. إشعار للمزادات بدون مزايدات
    const noBids = await prisma.direct_sales.findMany({
      where: {
        auction_status: "ended_no_bids",
        updated_at: { gte: fiveMinutesAgo },
      },
      select: {
        id: true,
        user_id: true,
        make: true,
        model: true,
      },
    });

    const noBidsNotifications = noBids.map(sale => ({
      user_id: sale.user_id,
      title: `❌ سيارتك ${sale.make} ${sale.model} لم تتلق عروضاً`,
      message: 'انتهى المزاد بدون مزايدات. عادت للبيع المباشر.',
      type: 'auction_no_bids' as const,
      is_read: false,
      created_at: now,
    }));

    const allNotifications = [
      ...winnerNotifications,
      ...reserveNotMetNotifications,
      ...noBidsNotifications
    ];

    if (allNotifications.length > 0) {
      await prisma.notifications.createMany({ data: allNotifications });
      // Sent ${allNotifications.length} notifications
    }
  } catch (error) {
    console.error('[SimpleAuction] Error sending ending notifications:', error);
  }
}

// ═══════════════════════════════════════════════════════════════
// 📊 استعلامات
// ═══════════════════════════════════════════════════════════════

/**
 * جلب المزادات النشطة
 */
export async function getActiveAuctions(page = 1, limit = 20) {
  const skip = (page - 1) * limit;

  const [auctions, total] = await Promise.all([
    prisma.direct_sales.findMany({
      where: {
        auction_mode: true,
        auction_status: "active",
      },
      include: {
        direct_sale_photos: true,
        users_direct_sales_user_idTousers: {
          select: { id: true, username: true },
        },
      },
      orderBy: { auction_end_date: 'asc' },
      skip,
      take: limit,
    }),
    prisma.direct_sales.count({
      where: {
        auction_mode: true,
        auction_status: "active",
      },
    }),
  ]);

  return { auctions, total, page, limit };
}

/**
 * جلب سيارة واحدة (بيع مباشر أو مزاد)
 */
export async function getListingById(id: number) {
  return prisma.direct_sales.findUnique({
    where: { id },
    include: {
      direct_sale_photos: true,
      users_direct_sales_user_idTousers: {
        select: { id: true, username: true, email: true },
      },
    },
  });
}

/**
 * تقديم عرض في المزاد
 */
export async function placeBid(listingId: number, userId: number, amount: number) {
  const now = new Date();

  // استخدام transaction للتأكد من الذرية
  return prisma.$transaction(async (tx) => {
    // جلب السيارة مع قفل
    const listing = await tx.direct_sales.findUnique({
      where: { id: listingId },
    });

    if (!listing) {
      throw new Error('السيارة غير موجودة');
    }

    if (!listing.auction_mode || listing.auction_status !== 'active') {
      throw new Error('المزاد غير نشط');
    }

    if (listing.auction_end_date && listing.auction_end_date < now) {
      throw new Error('انتهى وقت المزاد');
    }

    const currentBid = listing.auction_current_bid?.toNumber() || listing.auction_starting_price?.toNumber() || 0;
    if (amount <= currentBid) {
      throw new Error(`يجب أن يكون العرض أعلى من ${currentBid} درهم`);
    }

    // تحديث العرض الحالي
    const updated = await tx.direct_sales.update({
      where: { id: listingId },
      data: {
        auction_current_bid: amount,
        auction_winner_id: userId,
        auction_bid_count: { increment: 1 },
        updated_at: now,
      },
    });

    // تسجيل العرض في جدول bids (للتاريخ)
    // ملاحظة: قد تحتاج لإنشاء جدول direct_sales_bids

    // New bid placed

    return updated;
  });
}

// ═══════════════════════════════════════════════════════════════
// 📊 حالة النظام
// ═══════════════════════════════════════════════════════════════

export async function getSystemStatus() {
  const now = getMoroccoNow();
  const { startDate, endDate } = getNextWeekendDates();

  const [pending, active, completed, available] = await Promise.all([
    prisma.direct_sales.count({ where: { auction_status: 'pending' } }),
    prisma.direct_sales.count({ where: { auction_status: 'active' } }),
    prisma.direct_sales.count({ where: { auction_status: 'completed' } }),
    prisma.direct_sales.count({
      where: {
        verification_status: 'approved',
        sale_status: 'available',
        auction_mode: { not: true },
      }
    }),
  ]);

  return {
    currentTime: now.toISOString(),
    dayOfWeek: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][now.getDay()],
    nextWeekend: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    },
    counts: {
      pendingAuctions: pending,
      activeAuctions: active,
      completedAuctions: completed,
      availableForDirectSale: available,
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// 🔄 فحص تلقائي للمزادات المنتهية (يُستدعى عند كل طلب)
// ═══════════════════════════════════════════════════════════════

// Cache لمنع الفحص المتكرر (مرة كل 30 ثانية كحد أقصى)
let lastAutoCheckTime = 0;
const AUTO_CHECK_INTERVAL = 30 * 1000; // 30 ثانية

/**
 * فحص تلقائي خفيف للمزادات المنتهية
 * يُستدعى عند كل طلب لصفحة المزادات أو البيع المباشر
 * 
 * 🎯 الميزات:
 * - خفيف جداً (لا يُنفذ إلا إذا مرت 30 ثانية)
 * - يُنهي المزادات المنتهية تلقائياً
 * - يُرجع السيارات للبيع المباشر
 */
export async function autoCheckExpiredAuctions(): Promise<{ checked: boolean; ended: number }> {
  const now = Date.now();

  // لا نفحص إلا إذا مرت 30 ثانية على آخر فحص
  if (now - lastAutoCheckTime < AUTO_CHECK_INTERVAL) {
    return { checked: false, ended: 0 };
  }

  lastAutoCheckTime = now;

  try {
    // فحص سريع: هل توجد مزادات منتهية؟
    const expiredCount = await prisma.direct_sales.count({
      where: {
        auction_mode: true,
        auction_status: 'active',
        auction_end_date: { lte: new Date() }
      }
    });

    // إذا لا توجد مزادات منتهية، نخرج فوراً
    if (expiredCount === 0) {
      return { checked: true, ended: 0 };
    }

    // Found expired auctions - ending them

    // إنهاء المزادات المنتهية
    const result = await endAllAuctions();

    // Ended auctions automatically

    return { checked: true, ended: result.totalEnded };

  } catch (error) {
    console.error('[AutoCheck] ❌ Error checking expired auctions:', error);
    return { checked: true, ended: 0 };
  }
}

