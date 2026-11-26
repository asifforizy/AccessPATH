export interface IUploadResult {
  success: boolean;
  url?: string;
  message: string;
}

export const uploadImage = async (file: File): Promise<IUploadResult> => {
  const form = new FormData();
  form.append("file", file);

  try {
    const response = await fetch("/api/uploads", {
      method: "POST",
      body: form,
    });
    const body = (await response.json().catch(() => null)) as {
      success?: boolean;
      url?: string;
      message?: string;
    } | null;

    if (!response.ok || !body?.success || !body.url) {
      return {
        success: false,
        message: body?.message ?? "Image upload failed",
      };
    }

    return { success: true, url: body.url, message: "Image uploaded" };
  } catch {
    return { success: false, message: "Image upload failed" };
  }
};
