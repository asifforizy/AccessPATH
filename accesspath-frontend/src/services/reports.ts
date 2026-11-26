"use server";

import { revalidatePath } from "next/cache";

import { apiFetch, buildQuery } from "@/lib/api";
import type { ActionResult, IAuditLog, IReport } from "@/utils/types";

export async function getReports(params?: {
  page?: number;
  limit?: number;
  status?: string;
  type?: string;
  locationId?: string;
}) {
  return apiFetch<IReport[]>(`/reports${buildQuery(params ?? {})}`);
}

export async function getMyReports(limit = 10) {
  return apiFetch<IReport[]>(`/reports/my-reports${buildQuery({ limit })}`);
}

export async function getNearbyReports(params: {
  latitude: number;
  longitude: number;
  radiusMeters?: number;
}) {
  return apiFetch<IReport[]>(`/reports/nearby${buildQuery(params)}`);
}

export async function getReport(reportId: string) {
  return apiFetch<IReport>(`/reports/${reportId}`);
}

export async function getReportHistory(reportId: string) {
  return apiFetch<IAuditLog[]>(`/reports/${reportId}/history`);
}

export async function getReportVerification(reportId: string) {
  return apiFetch<{
    reportId: string;
    status: string;
    verified: boolean;
    verifications?: unknown[];
  }>(`/reports/${reportId}/verification`);
}

export async function createReport(payload: {
  locationId: string;
  type: string;
  description: string;
  attachments?: Array<{ url: string; publicId?: string }>;
}): Promise<ActionResult> {
  const res = await apiFetch("/reports", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/reports");
  revalidatePath("/dashboard");
  return { success: true, message: "Report created" };
}

export async function updateReport(
  reportId: string,
  payload: {
    type?: string;
    description?: string;
    status?: string;
  },
): Promise<ActionResult> {
  const res = await apiFetch(`/reports/${reportId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/reports");
  revalidatePath(`/reports/${reportId}`);
  return { success: true, message: "Report updated" };
}

export async function deleteReport(reportId: string): Promise<ActionResult> {
  const res = await apiFetch(`/reports/${reportId}`, { method: "DELETE" });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/reports");
  revalidatePath("/dashboard");
  return { success: true, message: "Report deleted" };
}

export async function addReportAttachments(
  reportId: string,
  attachments: Array<{ url: string; publicId?: string }>,
): Promise<ActionResult> {
  const res = await apiFetch(`/reports/${reportId}/attachments`, {
    method: "POST",
    body: JSON.stringify({ attachments }),
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath(`/reports/${reportId}`);
  return { success: true, message: "Attachments added" };
}
