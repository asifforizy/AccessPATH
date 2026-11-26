"use server";

import { apiFetch, buildQuery } from "@/lib/api";
import type { ILocationCard, ILocationDetail } from "@/utils/types";

export async function getLocations(params?: {
  page?: number;
  limit?: number;
  q?: string;
  city?: string;
  categoryId?: string;
}) {
  return apiFetch<ILocationCard[]>(`/locations${buildQuery(params ?? {})}`);
}

export async function getLocation(locationId: string) {
  return apiFetch<ILocationDetail>(`/locations/${locationId}`);
}

export async function getLocationCities() {
  return apiFetch<Array<{ city: string; count: number }>>("/locations/cities");
}
