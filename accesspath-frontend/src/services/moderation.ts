"use server";

import { revalidatePath } from "next/cache";

import { apiFetch, buildQuery } from "@/lib/api";
import type {
  ActionResult,
  IAuditLog,
  IContribution,
  IReport,
  IReview,
} from "@/utils/types";

export interface ModerationLocation {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  category?: { id: string; name: string } | null;
  createdBy?: { id: string; name: string } | null;
  accessibility?: Record<string, unknown> | null;
}

export async function getModerationQueue(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return apiFetch<{
    contributions: IContribution[];
    reports: IReport[];
    locations: ModerationLocation[];
    counts: {
      contributions: number;
      reports: number;
      locations: number;
      total: number;
    };
  }>(`/moderation/queue${buildQuery(params ?? {})}`);
}

export async function getModerationLocations(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return apiFetch<ModerationLocation[]>(
    `/moderation/locations${buildQuery(params ?? {})}`,
  );
}

export async function getModerationReports(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return apiFetch<IReport[]>(`/moderation/reports${buildQuery(params ?? {})}`);
}

export async function getModerationContributions(params?: {
  page?: number;
  limit?: number;
  status?: string;
}) {
  return apiFetch<IContribution[]>(
    `/moderation/contributions${buildQuery(params ?? {})}`,
  );
}

export async function getModerationFeedback(params?: {
  page?: number;
  limit?: number;
}) {
  return apiFetch<IReview[]>(`/moderation/feedback${buildQuery(params ?? {})}`);
}

export async function getModerationSubmission(submissionId: string) {
  return apiFetch<Record<string, unknown>>(`/moderation/${submissionId}`);
}

export async function getModerationHistory(params?: {
  page?: number;
  limit?: number;
  action?: string;
  entityType?: string;
}) {
  return apiFetch<IAuditLog[]>(
    `/moderation/history${buildQuery(params ?? {})}`,
  );
}

export async function getModerationStatistics() {
  return apiFetch<{
    contributions: { byStatus: Record<string, number>; total: number };
    reports: { byStatus: Record<string, number>; total: number };
    locations: { byStatus: Record<string, number>; total: number };
    totalReviews: number;
    totalFlags: number;
  }>("/moderation/statistics");
}

export async function approveSubmission(
  submissionId: string,
  note?: string,
): Promise<ActionResult> {
  const res = await apiFetch(`/moderation/${submissionId}/approve`, {
    method: "POST",
    body: JSON.stringify({ note: note || undefined }),
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/moderation");
  return { success: true, message: "Submission approved" };
}

export async function rejectSubmission(
  submissionId: string,
  note: string,
): Promise<ActionResult> {
  const res = await apiFetch(`/moderation/${submissionId}/reject`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/moderation");
  return { success: true, message: "Submission rejected" };
}

export async function requestSubmissionChanges(
  submissionId: string,
  note: string,
): Promise<ActionResult> {
  const res = await apiFetch(`/moderation/${submissionId}/request-changes`, {
    method: "POST",
    body: JSON.stringify({ note }),
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/moderation");
  return { success: true, message: "Changes requested" };
}

export async function verifySubmission(
  submissionId: string,
  note?: string,
): Promise<ActionResult> {
  const res = await apiFetch(`/moderation/${submissionId}/verify`, {
    method: "POST",
    body: JSON.stringify({ note: note || undefined }),
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/moderation");
  return { success: true, message: "Submission verified" };
}

export async function flagSubmission(
  submissionId: string,
  reason: string,
): Promise<ActionResult> {
  const res = await apiFetch(`/moderation/${submissionId}/flag`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/moderation");
  return { success: true, message: "Submission flagged" };
}
