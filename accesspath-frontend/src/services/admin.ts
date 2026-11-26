"use server";

import { revalidatePath } from "next/cache";

import { apiFetch, buildQuery } from "@/lib/api";
import type {
  ActionResult,
  IAdminSettings,
  IAdminStats,
  IAuditLog,
} from "@/utils/types";

export async function getHealth() {
  return apiFetch<{
    status: string;
    database: string;
    environment: string;
    uptimeSeconds: number;
    timestamp: string;
  }>("/admin/health");
}

export async function getVersion() {
  return apiFetch<{
    name: string;
    apiVersion: string;
    environment: string;
    nodeVersion: string;
  }>("/admin/version");
}

export async function getAdminStats() {
  return apiFetch<IAdminStats>("/admin/stats");
}

export async function getAuditLogs(params?: {
  page?: number;
  limit?: number;
  action?: string;
  actorId?: string;
  entityType?: string;
  entityId?: string;
  from?: string;
  to?: string;
}) {
  return apiFetch<IAuditLog[]>(`/admin/audit-logs${buildQuery(params ?? {})}`);
}

export async function getAdminSettings() {
  return apiFetch<IAdminSettings>("/admin/settings");
}

export async function updateAdminSettings(payload: {
  siteName?: string;
  supportEmail?: string;
  maintenanceMode?: boolean;
  allowRegistrations?: boolean;
  defaultPageSize?: number;
  maxUploadSizeMb?: number;
  features?: Record<string, boolean>;
}): Promise<ActionResult> {
  const res = await apiFetch("/admin/settings", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/admin");
  return { success: true, message: "Settings updated" };
}

export async function clearAdminCache(): Promise<ActionResult> {
  const res = await apiFetch<{ message?: string }>("/admin/cache/clear", {
    method: "POST",
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/admin");
  return {
    success: true,
    message: res.data?.message ?? "Cache cleared",
  };
}
