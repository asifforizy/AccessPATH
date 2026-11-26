"use server";

import { revalidatePath } from "next/cache";

import { apiFetch, buildQuery } from "@/lib/api";
import type {
  ActionResult,
  IAdminCategory,
  IAdminLocation,
  IAdminManagedUser,
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

/* --------------------------- user management --------------------------- */

export async function getAdminUsers(params?: {
  q?: string;
  role?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  return apiFetch<IAdminManagedUser[]>(
    `/admin/users${buildQuery(params ?? {})}`,
  );
}

export async function updateAdminUser(
  userId: string,
  payload: { role?: string; status?: string },
): Promise<ActionResult> {
  const res = await apiFetch(`/admin/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/admin/users");
  revalidatePath("/admin");
  return { success: true, message: "User updated" };
}

/* ------------------------- category management ------------------------- */

export async function getAdminCategories() {
  return apiFetch<IAdminCategory[]>("/admin/categories");
}

export async function createAdminCategory(payload: {
  name: string;
  description?: string;
  icon?: string;
}): Promise<ActionResult> {
  const res = await apiFetch("/admin/categories", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/admin/categories");
  return { success: true, message: "Category created" };
}

export async function updateAdminCategory(
  categoryId: string,
  payload: {
    name?: string;
    description?: string;
    icon?: string;
    isActive?: boolean;
  },
): Promise<ActionResult> {
  const res = await apiFetch(`/admin/categories/${categoryId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/admin/categories");
  return { success: true, message: "Category updated" };
}

export async function deleteAdminCategory(
  categoryId: string,
): Promise<ActionResult> {
  const res = await apiFetch(`/admin/categories/${categoryId}`, {
    method: "DELETE",
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/admin/categories");
  return { success: true, message: res.message };
}

/* ------------------------- location management ------------------------- */

export async function getAdminLocations(params?: {
  q?: string;
  status?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
}) {
  return apiFetch<IAdminLocation[]>(
    `/admin/locations${buildQuery(params ?? {})}`,
  );
}

export async function updateAdminLocation(
  locationId: string,
  payload: Record<string, unknown>,
): Promise<ActionResult> {
  const res = await apiFetch(`/admin/locations/${locationId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/admin/locations");
  revalidatePath(`/admin/locations/${locationId}`);
  return { success: true, message: "Location updated" };
}

export async function updateAdminAccessibility(
  locationId: string,
  payload: Record<string, unknown>,
): Promise<ActionResult> {
  const res = await apiFetch(`/admin/locations/${locationId}/accessibility`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath(`/admin/locations/${locationId}`);
  return { success: true, message: "Accessibility information updated" };
}

export async function archiveAdminLocation(
  locationId: string,
): Promise<ActionResult> {
  const res = await apiFetch(`/admin/locations/${locationId}`, {
    method: "DELETE",
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/admin/locations");
  return { success: true, message: "Location archived" };
}
