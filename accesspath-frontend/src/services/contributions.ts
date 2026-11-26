"use server";

import { revalidatePath } from "next/cache";

import { apiFetch, buildQuery } from "@/lib/api";
import type { ActionResult, IAuditLog, IContribution } from "@/utils/types";

export async function getContributions(params?: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  locationId?: string;
}) {
  return apiFetch<IContribution[]>(`/contributions${buildQuery(params ?? {})}`);
}

export async function getMyContributions(limit = 10) {
  return apiFetch<IContribution[]>(
    `/contributions/my-contributions${buildQuery({ limit })}`,
  );
}

export async function getContribution(contributionId: string) {
  return apiFetch<IContribution>(`/contributions/${contributionId}`);
}

export async function getContributionStatistics() {
  return apiFetch<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  }>("/contributions/statistics");
}

export async function getContributionHistory(contributionId: string) {
  return apiFetch<IAuditLog[]>(`/contributions/${contributionId}/history`);
}

export async function createContribution(payload: {
  type: string;
  title?: string;
  description?: string;
  proposedData: Record<string, unknown>;
  locationId?: string;
}): Promise<ActionResult> {
  const res = await apiFetch("/contributions", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/contribute");
  revalidatePath("/dashboard");
  return { success: true, message: "Contribution submitted" };
}

export async function updateContribution(
  contributionId: string,
  payload: {
    title?: string;
    description?: string;
    proposedData?: Record<string, unknown>;
  },
): Promise<ActionResult> {
  const res = await apiFetch(`/contributions/${contributionId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/contribute");
  return { success: true, message: "Contribution updated" };
}

export async function deleteContribution(
  contributionId: string,
): Promise<ActionResult> {
  const res = await apiFetch(`/contributions/${contributionId}`, {
    method: "DELETE",
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/contribute");
  revalidatePath("/dashboard");
  return { success: true, message: "Contribution deleted" };
}
