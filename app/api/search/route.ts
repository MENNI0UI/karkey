import { NextResponse } from "next/server";
import { searchVehicles } from "@/app/actions";
import { createMetricsContext } from "@/lib/metrics";
import logger from "@/lib/logger";

export async function GET(request: Request) {
  const metrics = createMetricsContext();
  metrics.start("api-search-total");

  try {
    const url = new URL(request.url);
    const q = (url.searchParams.get("q") ?? "").trim();
    const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
    const limit = Math.min(200, Math.max(10, Number(url.searchParams.get("limit") ?? "50"))); // sane bounds

    // collect simple filter params (optional) -- accept both `fuelType` and `fuel` (and tolerate common typos)
    const filters: any = {};
    const multiFilterKeys = ["make", "model", "year", "fuel", "fuelType", "transmission", "location", "condition", "exteriorColor", "interiorColor"];
    for (const k of [
      "make",
      "model",
      "year",
      "fuelType",
      "fuel",
      "transmission",
      "location",
      "minPrice",
      "maxPrice",
      "minMileage",
      "maxMileage",
      "minEngine",
      "maxEngine",
      "condition",
      "doors",
      "exteriorColor",
      "interiorColor",
      "originalPaint",
      "type",
    ]) {
      if (multiFilterKeys.includes(k)) {
        const v = url.searchParams.getAll(k);
        if (v && v.length > 0) filters[k] = v.length === 1 ? v[0] : v;
      } else {
        const v = url.searchParams.get(k);
        if (v) filters[k] = v;
      }
    }
    // tolerate common client typos/aliases (e.g. `furl`, `fuels`) and normalize into `fuel`
    const aliasFuel = url.searchParams.get("furl") ?? url.searchParams.get("fuels") ?? null;
    if (aliasFuel && !filters.fuel && !filters.fuelType) {
      filters.fuel = aliasFuel;
    }
    if (q) filters.q = q;

    // Call server-side search helper with pagination
    metrics.start("db-search-core");
    const result = await searchVehicles(filters, page, limit).catch(() => ({ success: false, vehicles: [], hasMore: false }));
    const vehicles = result.vehicles || [];
    metrics.end("db-search-core", { query: q, count: vehicles.length });

    metrics.end("api-search-total");
    return NextResponse.json({
      success: result.success ?? false,
      results: vehicles,
      hasMore: Boolean(result.hasMore),
      reqId: metrics.reqId // Expose to client for debugging
    });
  } catch (err) {
    metrics.info("api-search-error", String(err));
    logger.error("[api/search] error:", err);
    return NextResponse.json({ success: false, error: "server_error", results: [], reqId: metrics.reqId }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    // body expected to contain optional filters matching searchVehicles signature
    const res = await searchVehicles(body ?? {});
    return NextResponse.json(res, { status: 200 });
  } catch (err) {
    logger.error("[api/search] error:", err);
    return NextResponse.json({ success: false, error: "Server error", vehicles: [] }, { status: 500 });
  }
}
