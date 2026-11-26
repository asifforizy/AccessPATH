"use server";

import { publicApiFetch } from "@/lib/api";
import type { IPublicHome } from "@/utils/types";

export async function getPublicHome() {
  return publicApiFetch<IPublicHome>("/public/home");
}
