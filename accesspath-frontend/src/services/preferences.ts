"use server";

import { revalidatePath } from "next/cache";

import { apiFetch, buildQuery } from "@/lib/api";
import type {
  ActionResult,
  IRecommendationResult,
  IUserPreference,
} from "@/utils/types";

export async function getPreferences() {
  return apiFetch<IUserPreference>("/preferences");
}

export async function updatePreferences(payload: {
  travelMode?: string;
  accessibilityNeeds?: Record<string, unknown>;
  preferredLanguage?: string;
  notificationEnabled?: boolean;
}): Promise<ActionResult> {
  const res = await apiFetch("/preferences", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/preferences");
  return { success: true, message: "Preferences saved" };
}

export async function getAccessibilityPreferences() {
  return apiFetch<{
    userId: string;
    accessibilityNeeds: Record<string, unknown>;
  }>("/preferences/accessibility");
}

export async function updateAccessibilityPreferences(
  accessibilityNeeds: Record<string, unknown>,
): Promise<ActionResult> {
  const res = await apiFetch("/preferences/accessibility", {
    method: "PUT",
    body: JSON.stringify({ accessibilityNeeds }),
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/preferences");
  return { success: true, message: "Accessibility needs saved" };
}

export async function getRecommendations(limit = 10) {
  return apiFetch<IRecommendationResult>(
    `/preferences/recommendations${buildQuery({ limit })}`,
  );
}
