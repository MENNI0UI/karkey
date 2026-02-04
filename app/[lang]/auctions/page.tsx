import React from "react"
export const dynamic = 'force-dynamic'
import AuctionsPageClient from "@/components/auctions-page-client"
import { getFilterOptions, searchVehicles, getRecentAuctions } from "@/app/actions"
import { handleSavedSearchRedirect, getSavedSearchState } from "@/lib/server-saved-search"

export default async function AuctionsPage({
	searchParams,
	params,
}: {
	searchParams: Promise<{ [key: string]: string | string[] | undefined }>
	params: Promise<{ lang: string }>
}) {
	const sp = await searchParams
	let filterOptions: any = {}
	let initialVehicles: any[] = []

	let initialSavedState = { isMatch: false, savedId: null as number | null, paramsStr: null as string | null }

	try {
		const lang = (await params).lang
		// 1. Check for saved search and redirect IF no filters are present
		await handleSavedSearchRedirect('auctions', lang, sp)

		// 2. Hydrate saved search state
		initialSavedState = await getSavedSearchState('auctions', sp)

		// 3. Normal data fetching
		const [opts, searchRes] = await Promise.all([
			getFilterOptions(),
			searchVehicles({ ...sp, type: 'auction', limit: 12 } as any)
		])

		if (opts?.success && opts.options) filterOptions = opts.options
		if (searchRes?.success) {
			if (searchRes.vehicles) initialVehicles = searchRes.vehicles
			// Fallback if search returns nothing (e.g. empty filter), show recent
			if (initialVehicles.length === 0 && !Object.keys(sp).length) {
				const fallback = await getRecentAuctions(1, 12)
				if (fallback?.success && fallback.auctions) initialVehicles = fallback.auctions
			}
		} else {
			// If search failed or wasn't needed, try recent auctions
			const fallback = await getRecentAuctions(1, 12)
			if (fallback?.success && fallback.auctions) initialVehicles = fallback.auctions
		}
	} catch (err: any) {
		if (err.digest?.startsWith('NEXT_REDIRECT')) throw err
		console.error("[AuctionsPage] Failed to load initial data", err)
	}

	return <AuctionsPageClient initialVehicles={initialVehicles} filterOptions={filterOptions} initialSavedState={initialSavedState} />
}