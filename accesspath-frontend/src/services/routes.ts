"use server";

import { revalidatePath } from "next/cache";

import { apiFetch, buildQuery } from "@/lib/api";
import type {
  ActionResult,
  IPlanRouteResult,
  IRouteOption,
  IRoutePlan,
} from "@/utils/types";

type TravelMode = "WALKING" | "WHEELCHAIR" | "CYCLING" | "DRIVING";

export interface Coordinate {
  name?: string;
  latitude: number;
  longitude: number;
}

export interface RoutePlanPayload {
  origin: Coordinate;
  destination: Coordinate;
  travelMode?: TravelMode;
  accessibilityRequirements?: Record<string, unknown>;
  save?: boolean;
  name?: string;
}

export async function planRoute(payload: RoutePlanPayload) {
  return apiFetch<IPlanRouteResult>("/routes/plan", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getRouteAlternatives(
  payload: RoutePlanPayload & { count?: number },
) {
  return apiFetch<{
    origin: Coordinate;
    destination: Coordinate;
    travelMode: string;
    recommendedId: string | null;
    alternatives: IRouteOption[];
  }>("/routes/alternatives", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function validateRoute(payload: {
  origin: Coordinate;
  destination: Coordinate;
  travelMode?: TravelMode;
}) {
  return apiFetch<{
    origin: Coordinate;
    destination: Coordinate;
    travelMode: string;
    distanceMeters: number;
    estimatedDurationSeconds: number;
  }>("/routes/validate", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function scoreRoute(payload: {
  routeId?: string;
  origin?: Coordinate;
  destination?: Coordinate;
  radiusMeters?: number;
}) {
  return apiFetch<{
    routeId?: string;
    accessibilityScore: number;
    averageScore: number;
    rating?: string;
  }>("/routes/score", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getRoute(routeId: string) {
  return apiFetch<IRoutePlan>(`/routes/${routeId}`);
}

export async function getRouteBarriers(routeId: string, radiusMeters?: number) {
  return apiFetch<{
    routeId: string;
    total: number;
    barriers: Array<{
      id: string;
      type: string;
      description: string;
      distanceMeters: number;
      location?: { id: string; name: string; slug: string };
    }>;
  }>(`/routes/${routeId}/barriers${buildQuery({ radiusMeters })}`);
}

export async function getRouteAccessibility(
  routeId: string,
  radiusMeters?: number,
) {
  return apiFetch<{
    routeId: string;
    averageScore: number;
    locations: Array<{
      id: string;
      name: string;
      distanceMeters: number;
      accessibilityScore: number;
    }>;
  }>(`/routes/${routeId}/accessibility${buildQuery({ radiusMeters })}`);
}

export async function submitRouteFeedback(
  routeId: string,
  payload: { rating: number; comment?: string },
): Promise<ActionResult> {
  const res = await apiFetch(`/routes/${routeId}/feedback`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/routes");
  return { success: true, message: "Route feedback submitted" };
}

export async function getRoutePreferences() {
  return apiFetch<Record<string, unknown>>("/routes/preferences");
}

export async function updateRoutePreferences(payload: {
  travelMode?: TravelMode;
  accessibilityNeeds?: Record<string, unknown>;
  preferredLanguage?: string;
  notificationEnabled?: boolean;
}): Promise<ActionResult> {
  const res = await apiFetch("/routes/preferences", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (!res.success) return { success: false, message: res.message };

  revalidatePath("/routes");
  return { success: true, message: "Route preferences saved" };
}
