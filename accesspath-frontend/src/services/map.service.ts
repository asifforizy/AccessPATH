import { geoFetch } from "@/lib/geo-api";
import type {
  IMapBounds,
  IPlaceExploreMeta,
  IPlaceFeatureCollection,
} from "@/types/place.types";

export interface IExploreRequest {
  bounds: IMapBounds;
  zoom: number;
  category?: string | null;
  features?: string[];
  verifiedOnly?: boolean;
  limit?: number;
}

const featureParams = (features: string[] | undefined) => {
  const params: Record<string, boolean> = {};

  for (const feature of features ?? []) {
    params[feature] = true;
  }

  return params;
};

/**
 * Fetch map markers for the visible bounds (viewport-based loading).
 * Bounds are sent to the API so only visible locations are transferred.
 */
export const explorePlaces = (request: IExploreRequest, signal?: AbortSignal) =>
  geoFetch<IPlaceFeatureCollection>(
    "maps/explore",
    {
      north: request.bounds.north,
      south: request.bounds.south,
      east: request.bounds.east,
      west: request.bounds.west,
      zoom: request.zoom,
      category: request.category,
      limit: request.limit ?? 400,
      verifiedOnly: request.verifiedOnly ? true : undefined,
      ...featureParams(request.features),
    },
    signal,
  );

export type { IPlaceExploreMeta };
