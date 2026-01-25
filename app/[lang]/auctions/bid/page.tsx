"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { sanitizeImageUrl } from "@/lib/security-utils"
import Image from "next/image"
import Link from "next/link"
import { useTranslation } from "@/lib/i18n-context"

export default function AuctionBidPage() {
  const { t } = useTranslation()
  const searchParams = useSearchParams()
  const id = searchParams.get("id")
  const [auction, setAuction] = useState<any>(null)
  const [bid, setBid] = useState("")
  const [status, setStatus] = useState<"idle" | "submitted">("idle")
  const [imgIdx, setImgIdx] = useState(0)

  useEffect(() => {
    if (!id) return
    fetch(`/api/auctions/${id}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setAuction(data))
      .catch(() => {
        fetch("/api/auctions/approved")
          .then(res => res.json())
          .then(data => {
            const found = Array.isArray(data.auctions)
              ? data.auctions.find((a: any) => String(a.id) === String(id))
              : null
            setAuction(found)
          })
          .catch(() => setAuction(null))
      })
  }, [id])

  if (!id) {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center">
        <p className="text-lg text-[#103090]">No auction selected.</p>
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center">
        <p className="text-lg text-[#103090]">Loading auction details...</p>
      </div>
    )
  }

  if (status === "submitted") {
    return (
      <div className="max-w-xl mx-auto mt-20 text-center">
        <h2 className="text-2xl font-bold font-serif text-[#103090] mb-4">Bid Submitted!</h2>
        <p className="text-[#B8071C]">Thank you for your bid on <span className="font-semibold">{auction.model || auction.title}</span>.</p>
      </div>
    )
  }

  // Normalize data for display
  const photos = auction.photos ?? auction.vehicle?.photos ?? (auction.image ? [auction.image] : ["/placeholder.svg"])
  const seller = auction.seller ?? auction.owner ?? auction.user ?? auction.vehicle?.seller ?? {}
  const sellerName = seller?.name ?? seller?.username ?? seller?.first_name ?? "Seller"
  const sellerAvatar = sanitizeImageUrl(seller?.avatar ?? seller?.profile_picture)
  const model = auction.model ?? auction.vehicle?.model ?? auction.title ?? "Vehicle"
  const make = auction.make ?? auction.vehicle?.make ?? "—"
  const year = auction.year ?? auction.vehicle?.year ?? "—"
  const location = auction.location ?? auction.vehicle?.location ?? auction.vehicle?.city ?? auction.city ?? "—"
  const price = auction.starting_price ?? auction.price ?? auction.vehicle?.starting_price ?? "Contact for price"
  const mileage = auction.mileage ?? auction.vehicle?.mileage ?? "—"
  const transmission = auction.transmission ?? auction.vehicle?.transmission ?? "—"
  const fuelType = auction.fuel_type ?? auction.vehicle?.fuel_type ?? "—"
  const condition = auction.vehicle_condition ?? auction.vehicle?.vehicle_condition ?? "—"
  const engineSize = auction.engine_size ?? auction.vehicle?.engine_size ?? "—"

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <Card>
        <CardContent className="p-6">
          {/* Image gallery */}
          <div className="mb-6">
            <div className="relative w-full aspect-[5/6] rounded-xl overflow-hidden bg-[#f8f8f8]">
              <Image
                src={sanitizeImageUrl(photos[imgIdx])}
                alt={model}
                fill
                className="object-cover object-center"
                unoptimized
                style={{ borderRadius: "1rem" }}
              />
              {photos.length > 1 && (
                <>
                  <button
                    onClick={() => setImgIdx((i) => (i - 1 + photos.length) % photos.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow-lg z-10"
                  >
                    {"<"}
                  </button>
                  <button
                    onClick={() => setImgIdx((i) => (i + 1) % photos.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/90 shadow-lg z-10"
                  >
                    {">"}
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                    {photos.map((_: string, idx: number) => (
                      <span
                        key={idx}
                        className={`inline-block w-2 h-2 rounded-full ${imgIdx === idx ? "bg-[#B8071C]" : "bg-[#cfe0ff]"}`}
                        style={{ transition: "background 0.2s" }}
                        onClick={() => setImgIdx(idx)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Vehicle/Auction info */}
          <h1 className="text-2xl font-bold font-serif text-[#103090] mb-2">{model}</h1>
          <div className="mb-2 text-[#717171]">{make} {year !== "—" ? `• ${year}` : ""}</div>
          <div className="mb-2 text-[#717171]">{t(`location.city.${(location || "").toLowerCase().replace(/\s+/g, '')}` as any) || location}</div>
          <div className="mb-4 flex items-center gap-3">
            <Image
              src={sellerAvatar}
              alt={sellerName}
              width={40}
              height={40}
              className="rounded-full border-2 border-[#eadfca]"
              unoptimized
            />
            <span className="font-semibold text-[#103090]">{sellerName}</span>
          </div>
          <div className="mb-4">
            <span className="font-semibold text-[#B8071C]">Starting Price: </span>
            <span>{price} MAD</span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div>
              <span className="text-[#b89c4e] font-semibold">Mileage:</span> {mileage}
            </div>
            <div>
              <span className="text-[#b89c4e] font-semibold">Transmission:</span> {transmission}
            </div>
            <div>
              <span className="text-[#b89c4e] font-semibold">Fuel Type:</span> {fuelType}
            </div>
            <div>
              <span className="text-[#b89c4e] font-semibold">Condition:</span> {condition}
            </div>
            <div>
              <span className="text-[#b89c4e] font-semibold">Engine Size:</span> {engineSize !== "—" ? `${engineSize} L` : "—"}
            </div>
          </div>

          {/* Bid form */}
          <form
            onSubmit={e => {
              e.preventDefault()
              setStatus("submitted")
            }}
            className="space-y-4"
          >
            <label className="block text-sm font-medium text-[#103090] mb-1">
              Your Bid (MAD)
            </label>
            <input
              type="number"
              min={typeof price === "number" ? price : undefined}
              required
              value={bid}
              onChange={e => setBid(e.target.value)}
              className="w-full px-4 py-2 border border-[#cfe0ff] rounded-md focus:ring-2 focus:ring-[#B8071C] text-[#103090]"
              placeholder="Enter your bid"
            />
            <Button type="submit" className="w-full bg-[#B8071C] text-white font-semibold py-2 rounded-lg">
              Place Bid
            </Button>
          </form>

          <div className="mt-3 flex items-center justify-end">
            <Link href={`/auctions/${auction.id}`} className="text-sm text-[#B8071C] hover:underline font-semibold">View</Link>
          </div>
        </CardContent>
      </Card>
    </div >
  )
}
