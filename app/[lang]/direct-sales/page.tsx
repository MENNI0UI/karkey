import React from "react"
export const dynamic = 'force-dynamic'
import DirectSalesPageClient from "@/components/direct-sales-page-client"
import { getDirectSalesFilterOptions } from "@/app/actions/filters"
import { searchDirectSales } from "@/app/actions/vehicles"
import { handleSavedSearchRedirect, getSavedSearchState } from "@/lib/server-saved-search"

export default async function DirectSalesPage({
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
		await handleSavedSearchRedirect('direct-sales', lang, sp)

		// 2. Hydrate saved search state
		initialSavedState = await getSavedSearchState('direct-sales', sp)

		// 3. Normal data fetching
		const [opts, searchRes] = await Promise.all([
			getDirectSalesFilterOptions(),
			searchDirectSales({ ...sp, limit: 20 } as any) // direct sales page size is 20
		])

		if (opts?.success && opts.options) filterOptions = opts.options
		if (searchRes?.success && searchRes.vehicles) initialVehicles = searchRes.vehicles
	} catch (err: any) {
		if (err.digest?.startsWith('NEXT_REDIRECT')) throw err
		console.error("[DirectSalesPage] Failed to load initial data", err)
	}

	return <DirectSalesPageClient filterOptions={filterOptions} initialVehicles={initialVehicles} initialSavedState={initialSavedState} />
}
