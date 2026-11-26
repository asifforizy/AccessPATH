"use server";

import { revalidatePath } from "next/cache";

import { apiFetch, buildQuery } from "@/lib/api";
import type { ActionResult, INotification } from "@/utils/types";

export async function getNotifications(params?: {
  page?: number;
  limit?: number;
  isRead?: boolean;
}) {
  return apiFetch<INotification[]>(`/notifications${buildQuery(params ?? {})}`);
}

export async function getUnreadCount() {
  return apiFetch<{ unreadCount: number }>("/notifications/unread-count");
}

export async function markNotificationRead(
  notificationId: string,
): Promise<ActionResult> {
  const res = await apiFetch(`/notifications/${notificationId}/read`, {
    method: "PATCH",
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/notifications");
  return { success: true, message: "Notification marked as read" };
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const res = await apiFetch("/notifications/read-all", {
    method: "PATCH",
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/notifications");
  return { success: true, message: "All notifications marked as read" };
}

export async function deleteNotification(
  notificationId: string,
): Promise<ActionResult> {
  const res = await apiFetch(`/notifications/${notificationId}`, {
    method: "DELETE",
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/notifications");
  return { success: true, message: "Notification deleted" };
}

export async function clearNotifications(): Promise<ActionResult> {
  const res = await apiFetch("/notifications", { method: "DELETE" });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/notifications");
  return { success: true, message: "All notifications cleared" };
}
