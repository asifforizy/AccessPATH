/**
 * Thin client-side transport for the geo proxy routes (see app/api/geo).
 * UI never talks to Express directly — see the proxy for cookie handling.
 */

export interface IGeoResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T | null;
  meta?: Record<string, unknown>;
}

type QueryValue = string | number | boolean | null | undefined;

const buildSearchString = (params: Record<string, QueryValue>) => {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }

  const query = search.toString();
  return query ? `?${query}` : "";
};

export const geoFetch = async <T>(
  path: string,
  params: Record<string, QueryValue> = {},
  signal?: AbortSignal,
): Promise<IGeoResponse<T>> => {
  const response = await fetch(`/api/geo/${path}${buildSearchString(params)}`, {
    signal,
    headers: { accept: "application/json" },
    cache: "no-store",
  });

  const body = (await response
    .json()
    .catch(() => null)) as IGeoResponse<T> | null;

  if (!body) {
    return {
      success: false,
      status: response.status,
      message: "The server returned an unreadable response",
      data: null,
    };
  }

  return {
    ...body,
    success: body.success && response.ok,
    status: response.status,
  };
};

export const isAbortError = (error: unknown) =>
  error instanceof DOMException && error.name === "AbortError";
