import { cookies } from "next/headers";

import type { IPaginationMeta } from "@/utils/types";

export interface ApiResponse<T> {
  success: boolean;
  status: number;
  message: string;
  data: T | null;
  meta?: IPaginationMeta;
}

export const apiFetch = async <T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;

  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Cookie", `accessToken=${accessToken}`);
  }

  try {
    const res = await fetch(`${process.env.BACKEND_API_URL}/api/v1${path}`, {
      ...init,
      headers,
      cache: "no-store",
    });

    const json = await res.json().catch(() => null);

    return {
      success: res.ok && (json?.success ?? true),
      status: res.status,
      message:
        json?.message ?? (res.ok ? "Request completed" : "Request failed"),
      data: (json?.data ?? null) as T | null,
      meta: json?.meta,
    };
  } catch {
    return {
      success: false,
      status: 0,
      message: "Unable to reach the API. Please try again.",
      data: null,
    };
  }
};

export const buildQuery = (
  params: Record<string, string | number | boolean | undefined | null>,
) => {
  const search = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }

  const query = search.toString();

  return query ? `?${query}` : "";
};
