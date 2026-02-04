import { NextResponse } from "next/server";
import { searchDirectSales } from "@/app/actions/vehicles";
import { createMetricsContext } from "@/lib/metrics";

export async function GET(request: Request) {
    const metrics = createMetricsContext();
    metrics.start("api-direct-sales-search-total");

    try {
        const url = new URL(request.url);
        const q = (url.searchParams.get("q") ?? "").trim();
        const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
        const limit = Math.min(200, Math.max(10, Number(url.searchParams.get("limit") ?? "20")));

        const filters: any = {};
        const multiFilterKeys = new Set(["make", "model", "year", "fuel", "fuel_type", "transmission", "location", "condition", "vehicle_condition"]);

        // Build filters from searchParams
        for (const [key, value] of url.searchParams.entries()) {
            if (multiFilterKeys.has(key)) {
                const vals = url.searchParams.getAll(key);
                filters[key] = vals.length === 1 ? vals[0] : vals;
            } else {
                filters[key] = value;
            }
        }

        if (q) filters.q = q;

        // Map common aliases
        if (filters.fuelType && !filters.fuel_type) filters.fuel_type = filters.fuelType;
        if (filters.condition && !filters.vehicle_condition) filters.vehicle_condition = filters.condition;

        metrics.start("db-direct-sales-search");
        const result = await searchDirectSales({ ...filters, limit, offset: (page - 1) * limit });
        metrics.end("db-direct-sales-search", { query: q, count: result.vehicles?.length || 0 });

        metrics.end("api-direct-sales-search-total");
        return NextResponse.json({
            success: result.success ?? false,
            results: result.vehicles || [],
            hasMore: Boolean(result.hasMore),
            reqId: metrics.reqId
        });
    } catch (err) {
        console.error("[api/direct-sales/search] error:", err);
        return NextResponse.json({ success: false, error: "server_error", results: [] }, { status: 500 });
    }
}
