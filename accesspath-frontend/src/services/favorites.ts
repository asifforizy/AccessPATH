"use server";

import { revalidatePath } from "next/cache";

import { apiFetch, buildQuery } from "@/lib/api";
import type { ActionResult, IFavorite } from "@/utils/types";

export async function getFavorites(params?: { page?: number; limit?: number }) {
  return apiFetch<IFavorite[]>(`/favorites${buildQuery(params ?? {})}`);
}

export async function addFavorite(locationId: string): Promise<ActionResult> {
  const res = await apiFetch("/favorites", {
    method: "POST",
    body: JSON.stringify({ locationId }),
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/favorites");
  revalidatePath("/dashboard");
  return { success: true, message: "Location added to favorites" };
}

export async function checkFavorite(locationId: string) {
  return apiFetch<{ locationId: string; isFavorite: boolean }>(
    `/favorites/check/${locationId}`,
  );
}

export async function removeFavorite(
  favoriteId: string,
): Promise<ActionResult> {
  const res = await apiFetch(`/favorites/${favoriteId}`, {
    method: "DELETE",
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/favorites");
  revalidatePath("/dashboard");
  return { success: true, message: "Favorite removed" };
}

export async function removeFavoriteByLocation(
  locationId: string,
): Promise<ActionResult> {
  const res = await apiFetch(`/favorites/locations/${locationId}`, {
    method: "DELETE",
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/favorites");
  revalidatePath("/dashboard");
  return { success: true, message: "Favorite removed" };
}
