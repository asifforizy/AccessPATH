"use server";

import { revalidatePath } from "next/cache";

import { apiFetch } from "@/lib/api";
import type { ActionResult, IPhoto } from "@/utils/types";

export interface ImageItem {
  url: string;
  publicId?: string;
  locationId?: string;
  reportId?: string;
  isPrimary?: boolean;
}

export async function uploadImage(item: ImageItem) {
  return apiFetch<IPhoto>("/uploads/images", {
    method: "POST",
    body: JSON.stringify(item),
  });
}

export async function uploadImages(items: ImageItem[]) {
  return apiFetch<IPhoto[]>("/uploads/images/multiple", {
    method: "POST",
    body: JSON.stringify({ items }),
  });
}

export async function getPresignedUrl(payload: {
  fileName: string;
  contentType: string;
  folder?: string;
}) {
  return apiFetch<{
    uploadUrl: string | null;
    publicUrl: string | null;
    method?: string;
    fields?: Record<string, string>;
    note?: string;
  }>("/uploads/presigned-url", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getMedia(mediaId: string) {
  return apiFetch<IPhoto>(`/uploads/${mediaId}`);
}

export async function deleteMedia(mediaId: string): Promise<ActionResult> {
  const res = await apiFetch(`/uploads/${mediaId}`, { method: "DELETE" });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/uploads");
  return { success: true, message: "Media deleted" };
}
