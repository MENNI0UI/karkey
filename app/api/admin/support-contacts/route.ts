import { NextResponse } from "next/server"
import { getAdminFromCookie } from "@/lib/admin-auth"
import prisma from "@/lib/prisma"
import { error as logError } from "@/lib/logger"
import { errorResponse } from "@/lib/errors"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const admin = await getAdminFromCookie()
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Fetch contacts with vehicle and user details using raw query (no relations defined in schema)
    const contacts = await prisma.$queryRaw<any[]>`
      SELECT 
        c.id,
        c.direct_sale_id,
        c.user_id,
        c.name as contact_name,
        c.email as contact_email,
        c.phone as contact_phone,
        c.message,
        c.created_at,
        c.processed,
        ds.make as vehicle_make,
        ds.model as vehicle_model,
        ds.year as vehicle_year,
        ds.price as vehicle_price,
        ds.mileage as vehicle_mileage,
        ds.fuel_type as vehicle_fuel,
        ds.transmission as vehicle_transmission,
        ds.location as vehicle_location,
        ds.vehicle_condition,
        ds.doors as vehicle_doors,
        ds.engine_size as vehicle_engine_size,
        ds.description as vehicle_description,
        seller.id as seller_id,
        seller.first_name as seller_first_name,
        seller.last_name as seller_last_name,
        seller.email as seller_email,
        seller.phone_number as seller_phone,
        requester.first_name as requester_first_name,
        requester.last_name as requester_last_name,
        requester.email as requester_email,
        requester.phone_number as requester_phone
      FROM direct_sales_contacts c
      LEFT JOIN direct_sales ds ON c.direct_sale_id = ds.id
      LEFT JOIN users seller ON ds.user_id = seller.id
      LEFT JOIN users requester ON c.user_id = requester.id
      ORDER BY c.created_at DESC
      LIMIT 500
    `

    // Get first photo for each vehicle
    const vehicleIds = [...new Set(contacts.map((c: any) => c.direct_sale_id).filter(Boolean))]

    const photosMap: Record<number, string> = {}
    if (vehicleIds.length > 0) {
      const photoRows = await prisma.direct_sale_photos.findMany({
        where: { direct_sale_id: { in: vehicleIds.map(Number) } },
        orderBy: { position_order: 'asc' }
      })
      for (const p of photoRows) {
        if (!photosMap[p.direct_sale_id]) {
          photosMap[p.direct_sale_id] = p.photo_url || ''
        }
      }
    }

    // Attach photo to each contact and convert BigInt to number for JSON
    const enrichedContacts = contacts.map((c: any) => ({
      id: Number(c.id),
      direct_sale_id: c.direct_sale_id ? Number(c.direct_sale_id) : null,
      user_id: c.user_id ? Number(c.user_id) : null,
      contact_name: c.contact_name,
      contact_email: c.contact_email,
      contact_phone: c.contact_phone,
      message: c.message,
      created_at: c.created_at,
      processed: c.processed,
      vehicle_make: c.vehicle_make,
      vehicle_model: c.vehicle_model,
      vehicle_year: c.vehicle_year,
      vehicle_price: c.vehicle_price,
      vehicle_mileage: c.vehicle_mileage,
      vehicle_fuel: c.vehicle_fuel,
      vehicle_transmission: c.vehicle_transmission,
      vehicle_location: c.vehicle_location,
      vehicle_condition: c.vehicle_condition,
      vehicle_doors: c.vehicle_doors,
      vehicle_engine_size: c.vehicle_engine_size,
      vehicle_description: c.vehicle_description,
      seller_id: c.seller_id ? Number(c.seller_id) : null,
      seller_first_name: c.seller_first_name,
      seller_last_name: c.seller_last_name,
      seller_email: c.seller_email,
      seller_phone: c.seller_phone,
      requester_first_name: c.requester_first_name,
      requester_last_name: c.requester_last_name,
      requester_email: c.requester_email,
      requester_phone: c.requester_phone,
      vehicle_photo: photosMap[Number(c.direct_sale_id)] || null
    }))

    return NextResponse.json({ success: true, contacts: enrichedContacts })
  } catch (err) {
    logError('[admin support contacts] Error:', err)
    return NextResponse.json(errorResponse(err), { status: 500 })
  }
}
