import { NextResponse } from "next/server"
import { getAdminFromCookie } from "@/lib/admin-auth"
import prisma from "@/lib/prisma"
import { errorResponse, ErrorCode } from "@/lib/errors"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const admin = await getAdminFromCookie()

    if (!admin || (admin.role !== "finance" && admin.role !== "ceo")) {
      return NextResponse.json({ error: { code: ErrorCode.UNAUTHORIZED, message: "Unauthorized" } }, { status: 401 })
    }

    // إحصائيات الإيداعات (Deposits)
    const depositsStats = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) as refunded,
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as totalPaidAmount,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as totalPendingAmount,
        SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END) as totalRefundedAmount
      FROM deposits
    `

    // إحصائيات المدفوعات (Payments)
    const paymentsStats = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'succeeded' THEN 1 ELSE 0 END) as succeeded,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN status = 'refunded' THEN 1 ELSE 0 END) as refunded,
        SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) as totalRevenue,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as totalPending,
        SUM(CASE WHEN status = 'refunded' THEN amount ELSE 0 END) as totalRefunded
      FROM payments
    `

    // إحصائيات الفواتير (Invoices)
    const invoicesStats = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN status = 'issued' THEN 1 ELSE 0 END) as issued,
        SUM(CASE WHEN status = 'void' THEN 1 ELSE 0 END) as voided,
        SUM(CASE WHEN status = 'paid' THEN total ELSE 0 END) as totalPaidAmount,
        SUM(CASE WHEN status = 'issued' THEN total ELSE 0 END) as totalIssuedAmount
      FROM invoices
    `

    // إحصائيات الاشتراكات (Subscriptions)
    const subscriptionsStats = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'expired' THEN 1 ELSE 0 END) as expired,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM subscriptions
    `

    // إيرادات الاشتراكات
    const subscriptionRevenue = await prisma.$queryRaw<any[]>`
      SELECT 
        COALESCE(SUM(p.price), 0) as totalRevenue
      FROM subscriptions s
      JOIN plans p ON s.plan_id = p.id
      WHERE s.status = 'active'
    `

    // المدفوعات اليوم
    const todayPayments = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total
      FROM payments
      WHERE DATE(created_at) = CURDATE() AND status = 'succeeded'
    `

    // المدفوعات هذا الأسبوع
    const weekPayments = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total
      FROM payments
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND status = 'succeeded'
    `

    // المدفوعات هذا الشهر
    const monthPayments = await prisma.$queryRaw<any[]>`
      SELECT 
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total
      FROM payments
      WHERE MONTH(created_at) = MONTH(CURDATE()) 
        AND YEAR(created_at) = YEAR(CURDATE()) 
        AND status = 'succeeded'
    `

    // آخر المعاملات
    const recentTransactions = await prisma.$queryRaw<any[]>`
      SELECT 
        p.id,
        p.amount,
        p.status,
        p.provider,
        p.created_at,
        u.username,
        u.email,
        CONCAT(v.first_name, ' ', v.last_name) as full_name
      FROM payments p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN verifications v ON u.id = v.user_id
      ORDER BY p.created_at DESC
      LIMIT 10
    `

    // آخر الإيداعات
    const recentDeposits = await prisma.$queryRaw<any[]>`
      SELECT 
        d.id,
        d.amount,
        d.status,
        d.method,
        d.created_at,
        u.username,
        u.email,
        a.id as auction_id,
        CONCAT(vh.make, ' ', vh.model) as vehicle_name
      FROM deposits d
      JOIN users u ON d.user_id = u.id
      LEFT JOIN auctions a ON d.auction_id = a.id
      LEFT JOIN vehicles vh ON a.vehicle_id = vh.id
      ORDER BY d.created_at DESC
      LIMIT 10
    `

    // الفواتير المستحقة
    const pendingInvoices = await prisma.$queryRaw<any[]>`
      SELECT 
        i.id,
        i.total,
        i.status,
        i.issued_at,
        i.due_at,
        u.username,
        u.email
      FROM invoices i
      JOIN users u ON i.user_id = u.id
      WHERE i.status = 'issued'
      ORDER BY i.due_at ASC
      LIMIT 10
    `

    // إحصائيات حسب طريقة الدفع
    const paymentMethods = await prisma.$queryRaw<any[]>`
      SELECT 
        provider,
        COUNT(*) as count,
        SUM(CASE WHEN status = 'succeeded' THEN amount ELSE 0 END) as total
      FROM payments
      GROUP BY provider
      ORDER BY total DESC
    `

    // نمو الإيرادات (مقارنة الشهر الحالي بالشهر السابق)
    const currentMonthRevenue = await prisma.$queryRaw<any[]>`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments
      WHERE MONTH(created_at) = MONTH(CURDATE()) 
        AND YEAR(created_at) = YEAR(CURDATE()) 
        AND status = 'succeeded'
    `

    const lastMonthRevenue = await prisma.$queryRaw<any[]>`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments
      WHERE MONTH(created_at) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) 
        AND YEAR(created_at) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH)) 
        AND status = 'succeeded'
    `

    const currentMonth = Number(currentMonthRevenue[0]?.total) || 0
    const lastMonth = Number(lastMonthRevenue[0]?.total) || 0
    const growth = lastMonth > 0 ? Math.round(((currentMonth - lastMonth) / lastMonth) * 100) : 0

    return NextResponse.json({
      success: true,
      stats: {
        overview: {
          totalRevenue: Number(paymentsStats[0]?.totalRevenue) || 0,
          pendingPayments: Number(paymentsStats[0]?.totalPending) || 0,
          totalDeposits: Number(depositsStats[0]?.totalPaidAmount) || 0,
          pendingDeposits: Number(depositsStats[0]?.totalPendingAmount) || 0,
          refundedAmount: Number(paymentsStats[0]?.totalRefunded) || 0,
          growth
        },
        deposits: {
          total: Number(depositsStats[0]?.total) || 0,
          paid: Number(depositsStats[0]?.paid) || 0,
          pending: Number(depositsStats[0]?.pending) || 0,
          refunded: Number(depositsStats[0]?.refunded) || 0,
          totalAmount: Number(depositsStats[0]?.totalPaidAmount) || 0
        },
        payments: {
          total: Number(paymentsStats[0]?.total) || 0,
          succeeded: Number(paymentsStats[0]?.succeeded) || 0,
          pending: Number(paymentsStats[0]?.pending) || 0,
          failed: Number(paymentsStats[0]?.failed) || 0,
          refunded: Number(paymentsStats[0]?.refunded) || 0
        },
        invoices: {
          total: Number(invoicesStats[0]?.total) || 0,
          paid: Number(invoicesStats[0]?.paid) || 0,
          issued: Number(invoicesStats[0]?.issued) || 0,
          voided: Number(invoicesStats[0]?.voided) || 0,
          totalPaidAmount: Number(invoicesStats[0]?.totalPaidAmount) || 0,
          totalIssuedAmount: Number(invoicesStats[0]?.totalIssuedAmount) || 0
        },
        subscriptions: {
          total: Number(subscriptionsStats[0]?.total) || 0,
          active: Number(subscriptionsStats[0]?.active) || 0,
          pending: Number(subscriptionsStats[0]?.pending) || 0,
          expired: Number(subscriptionsStats[0]?.expired) || 0,
          cancelled: Number(subscriptionsStats[0]?.cancelled) || 0,
          revenue: Number(subscriptionRevenue[0]?.totalRevenue) || 0
        },
        periods: {
          today: {
            count: Number(todayPayments[0]?.count) || 0,
            total: Number(todayPayments[0]?.total) || 0
          },
          week: {
            count: Number(weekPayments[0]?.count) || 0,
            total: Number(weekPayments[0]?.total) || 0
          },
          month: {
            count: Number(monthPayments[0]?.count) || 0,
            total: Number(monthPayments[0]?.total) || 0
          }
        },
        paymentMethods: paymentMethods || [],
        recentTransactions: recentTransactions || [],
        recentDeposits: recentDeposits || [],
        pendingInvoices: pendingInvoices || []
      }
    })
  } catch (error) {
    console.error("Finance stats error:", error)
    return NextResponse.json(errorResponse(error), { status: 500 })
  }
}
