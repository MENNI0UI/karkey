"use client"
import React from "react"

export default function ListingsSection({ auctions = [], mode = "listings" }: any) {
	if (!auctions || auctions.length === 0) {
		return <div className="p-6 text-center text-gray-600">No items</div>
	}
	return (
		<div className="grid gap-4">
			{auctions.map((a: any) => (
				<div key={a.id ?? Math.random()} className="p-3 border rounded">
					<div className="font-semibold">{a.title ?? "Listing"}</div>
				</div>
			))}
		</div>
	)
}
