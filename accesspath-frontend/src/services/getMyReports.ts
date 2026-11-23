import { IRecentItem } from "@/utils/types";
import { cookies } from "next/headers";

export const getMyReports = async (limit = 3): Promise<IRecentItem[]> => {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value || null;

  if (!accessToken) return [];

  try {
    const res = await fetch(
      `${process.env.BACKEND_API_URL}/api/v1/users/me/reports?page=1&limit=${limit}`,
      {
        headers: { Cookie: `accessToken=${accessToken}` },
        cache: "no-store",
      },
    );

    if (!res.ok) return [];

    const result = await res.json();
    return result?.data ?? [];
  } catch {
    return [];
  }
};