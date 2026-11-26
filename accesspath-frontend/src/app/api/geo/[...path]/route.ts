import { type NextRequest, NextResponse } from "next/server";

/**
 * Same-origin read proxy for the geo APIs.
 *
 * The browser must not talk to Express directly: the access token lives in an
 * httpOnly cookie that only Next can read. These handlers forward GET requests
 * (method + query string) to the existing Express API and pass the session
 * cookie through. Only `/maps` and `/places` are reachable.
 */

const ALLOWED_PREFIXES = new Set(["maps", "places"]);
const MAX_SEGMENTS = 3;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path } = await context.params;

  if (
    !Array.isArray(path) ||
    path.length === 0 ||
    path.length > MAX_SEGMENTS ||
    !ALLOWED_PREFIXES.has(path[0] ?? "") ||
    path.some(
      (segment) =>
        !segment ||
        segment === "." ||
        segment === ".." ||
        segment.includes("/") ||
        segment.includes("\\"),
    )
  ) {
    return NextResponse.json(
      { success: false, message: "Unknown geo endpoint" },
      { status: 404 },
    );
  }

  const accessToken = request.cookies.get("accessToken")?.value;
  const upstream = new URL(
    `${process.env.BACKEND_API_URL}/api/v1/${path.join("/")}`,
  );

  request.nextUrl.searchParams.forEach((value, key) => {
    upstream.searchParams.set(key, value);
  });

  try {
    const response = await fetch(upstream, {
      method: "GET",
      headers: {
        accept: "application/json",
        ...(accessToken ? { cookie: `accessToken=${accessToken}` } : {}),
      },
      cache: "no-store",
    });

    const body = await response.json().catch(() => null);

    return NextResponse.json(
      body ?? {
        success: false,
        message: "The geo API returned an unreadable response",
      },
      { status: response.status },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Unable to reach the geo API" },
      { status: 502 },
    );
  }
}
