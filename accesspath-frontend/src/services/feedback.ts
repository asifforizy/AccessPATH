"use server";

import { revalidatePath } from "next/cache";

import { apiFetch, buildQuery } from "@/lib/api";
import type { ActionResult, IReview } from "@/utils/types";

export async function getFeedback(params?: {
  page?: number;
  limit?: number;
  locationId?: string;
  userId?: string;
}) {
  return apiFetch<IReview[]>(`/feedback${buildQuery(params ?? {})}`);
}

export async function getLocationFeedback(locationId: string) {
  return apiFetch<{
    locationId: string;
    total: number;
    averageRating: number;
    distribution: Record<number, number>;
  }>(`/feedback/locations/${locationId}`);
}

export async function getLocationReviews(
  locationId: string,
  params?: { page?: number; limit?: number },
) {
  return apiFetch<IReview[]>(
    `/feedback/locations/${locationId}/reviews${buildQuery(params ?? {})}`,
  );
}

export async function createFeedback(payload: {
  locationId: string;
  rating: number;
  comment?: string;
}): Promise<ActionResult> {
  const res = await apiFetch("/feedback", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/feedback");
  return { success: true, message: "Feedback submitted" };
}

export async function createLocationReview(
  locationId: string,
  payload: { rating: number; comment?: string },
): Promise<ActionResult> {
  const res = await apiFetch(`/feedback/locations/${locationId}/reviews`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/feedback");
  return { success: true, message: "Review submitted" };
}

export async function updateFeedback(
  feedbackId: string,
  payload: { rating?: number; comment?: string },
): Promise<ActionResult> {
  const res = await apiFetch(`/feedback/${feedbackId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/feedback");
  return { success: true, message: "Feedback updated" };
}

export async function deleteFeedback(
  feedbackId: string,
): Promise<ActionResult> {
  const res = await apiFetch(`/feedback/${feedbackId}`, {
    method: "DELETE",
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/feedback");
  return { success: true, message: "Feedback deleted" };
}

export async function flagFeedback(
  feedbackId: string,
  reason: string,
): Promise<ActionResult> {
  const res = await apiFetch(`/feedback/${feedbackId}/flag`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/feedback");
  return { success: true, message: "Feedback flagged for review" };
}

export async function markFeedbackHelpful(
  feedbackId: string,
): Promise<ActionResult> {
  const res = await apiFetch<{ helpful: boolean; count: number }>(
    `/feedback/${feedbackId}/helpful`,
    { method: "POST" },
  );

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/feedback");
  return {
    success: true,
    message: res.data?.helpful ? "Marked as helpful" : "Helpful vote removed",
  };
}
