import { type NextRequest, NextResponse } from "next/server";

/**
 * Street-level geometry for the route planner preview.
 *
 * The backend scores a corridor from a handful of waypoints and does not hold a
 * routing engine (see docs/route-scoring.md), so the planner asks a public OSRM
 * instance for the road path it draws on the map. Scoring is untouched: this is
 * presentation only, and the UI falls back to the scored corridor if unreachable.
 */

// Point OSRM_BASE_URL at a self-hosted OSRM/Valhalla-compatible endpoint in production.
const OSRM_BASE =
  process.env.OSRM_BASE_URL ?? "https://router.project-osrm.org/route/v1";
const TIMEOUT_MS = 4_500;

const profiles: Record<string, string> = {
  WALKING: "foot",
  WHEELCHAIR: "foot",
  CYCLING: "bike",
  DRIVING: "driving",
};

interface OSRMRoute {
  distance: number;
  duration: number;
  geometry: { coordinates: Array<[number, number]> };
}

const numberParam = (params: URLSearchParams, key: string) => {
  const raw = Number(params.get(key));
  return Number.isFinite(raw) ? raw : null;
};

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const originLat = numberParam(params, "originLat");
  const originLng = numberParam(params, "originLng");
  const destinationLat = numberParam(params, "destinationLat");
  const destinationLng = numberParam(params, "destinationLng");
  const mode = (params.get("mode") ?? "WALKING").toUpperCase();
  const profile = profiles[mode] ?? "foot";

  if (
    originLat === null ||
    originLng === null ||
    destinationLat === null ||
    destinationLng === null ||
    Math.abs(originLat) > 90 ||
    Math.abs(destinationLat) > 90 ||
    Math.abs(originLng) > 180 ||
    Math.abs(destinationLng) > 180
  ) {
    return NextResponse.json(
      { success: false, message: "Valid origin and destination are required" },
      { status: 400 },
    );
  }

  const coordinates = `${originLng},${originLat};${destinationLng},${destinationLat}`;
  const url = `${OSRM_BASE}/${profile}/${coordinates}?overview=full&geometries=geojson&alternatives=3`;

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message: `Routing provider returned ${response.status}`,
        },
        { status: 502 },
      );
    }

    const body = (await response.json()) as {
      code?: string;
      routes?: OSRMRoute[];
    };

    if (
      body.code !== "Ok" ||
      !Array.isArray(body.routes) ||
      body.routes.length === 0
    ) {
      return NextResponse.json(
        { success: false, message: "No road path found for these points" },
        { status: 404 },
      );
    }

    const paths = body.routes.slice(0, 3).map((route) => ({
      distanceMeters: Math.round(route.distance),
      durationSeconds: Math.round(route.duration),
      // GeoJSON order is [lng, lat]; the UI works with named coordinates.
      coordinates: route.geometry.coordinates.map(([lng, lat]) => ({
        latitude: lat,
        longitude: lng,
      })),
    }));

    return NextResponse.json(
      { success: true, profile, paths },
      { headers: { "cache-control": "private, max-age=300" } },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Routing provider is unavailable" },
      { status: 504 },
    );
  }
}
