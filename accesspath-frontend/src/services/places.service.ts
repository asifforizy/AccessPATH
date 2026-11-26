import { geoFetch } from "@/lib/geo-api";
import type {
  INearbyPlace,
  IPlaceCard,
  IPlaceCategory,
  IPlaceDetail,
  IPlaceFilters,
  IPlaceSortMeta,
  PlaceSort,
} from "@/types/place.types";

const filterParams = (
  filters: Pick<IPlaceFilters, "category" | "features" | "verifiedOnly">,
) => {
  const params: Record<string, string | boolean> = {};
  if (filters.category) params.category = filters.category;
  if (filters.verifiedOnly) params.verifiedOnly = true;
  for (const feature of filters.features) params[feature] = true;
  return params;
};

export const searchPlaces = (
  params: {
    query?: string;
    filters: IPlaceFilters;
    sort: PlaceSort;
    origin?: { latitude: number; longitude: number } | null;
    page?: number;
    limit?: number;
  },
  signal?: AbortSignal,
) =>
  geoFetch<IPlaceCard[]>(
    "places/search",
    {
      query: params.query,
      sort: params.sort,
      latitude: params.origin?.latitude,
      longitude: params.origin?.longitude,
      page: params.page ?? 1,
      limit: params.limit ?? 30,
      ...filterParams(params.filters),
    },
    signal,
  );

export const nearbyPlaces = (
  params: {
    origin: { latitude: number; longitude: number };
    radius?: number;
    filters: IPlaceFilters;
    limit?: number;
  },
  signal?: AbortSignal,
) =>
  geoFetch<INearbyPlace[]>(
    "places/nearby",
    {
      latitude: params.origin.latitude,
      longitude: params.origin.longitude,
      radius: params.radius ?? 5_000,
      limit: params.limit ?? 24,
      ...filterParams(params.filters),
    },
    signal,
  );

export const getPlace = (placeId: string, signal?: AbortSignal) =>
  geoFetch<IPlaceDetail>(`places/${encodeURIComponent(placeId)}`, {}, signal);

export const getPlaceCategories = (signal?: AbortSignal) =>
  geoFetch<IPlaceCategory[]>("places/categories", {}, signal);

export type { IPlaceSortMeta };
