"use client";

import { useEffect, useState } from "react";

import { isAbortError } from "@/lib/geo-api";
import { explorePlaces } from "@/services/map.service";
import {
  getPlaceCategories,
  nearbyPlaces,
  searchPlaces,
} from "@/services/places.service";
import type { IMapViewport, IUserPosition } from "@/types/map.types";
import type {
  INearbyPlace,
  IPlaceCard,
  IPlaceCategory,
  IPlaceExploreMeta,
  IPlaceFilters,
  IPlaceGeoFeature,
  PlaceSort,
} from "@/types/place.types";

const EXPLORE_DEBOUNCE_MS = 350;
const SEARCH_DEBOUNCE_MS = 300;

interface IExploreState {
  features: IPlaceGeoFeature[];
  meta: IPlaceExploreMeta | null;
  loading: boolean;
  error: string | null;
}

const filtersKey = (filters: IPlaceFilters) =>
  JSON.stringify({
    category: filters.category,
    features: [...filters.features].sort(),
    verifiedOnly: filters.verifiedOnly,
  });

/**
 * Viewport-based map data.
 *
 * Refetches only when the visible bounds (rounded to ~10m) or filters change,
 * ignores stale responses via AbortController, and keeps the previous markers
 * visible while a new viewport is loading.
 */
export const useMapLocations = (params: {
  viewport: IMapViewport | null;
  filters: IPlaceFilters;
  enabled: boolean;
  refreshToken?: number;
}) => {
  const { viewport, enabled, refreshToken } = params;
  const key = filtersKey(params.filters);

  const [state, setState] = useState<IExploreState>({
    features: [],
    meta: null,
    loading: false,
    error: null,
  });

  // refreshToken is a manual retry trigger, not derived state.
  // biome-ignore lint/correctness/useExhaustiveDependencies: retry trigger
  useEffect(() => {
    if (!enabled || !viewport) return;

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setState((previous) => ({ ...previous, loading: true, error: null }));

      try {
        const filters = JSON.parse(key) as IPlaceFilters;
        const response = await explorePlaces(
          {
            bounds: viewport,
            zoom: viewport.zoom,
            category: filters.category,
            features: filters.features,
            verifiedOnly: filters.verifiedOnly,
          },
          controller.signal,
        );

        if (!response.success || !response.data) {
          setState((previous) => ({
            ...previous,
            loading: false,
            error: response.message || "Unable to load map locations",
          }));
          return;
        }

        setState({
          features: response.data.features,
          meta: response.data.meta,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (isAbortError(error)) return;
        setState((previous) => ({
          ...previous,
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Unable to load map locations",
        }));
      }
    }, EXPLORE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, key, viewport, refreshToken]);

  return state;
};

interface ISearchState {
  items: IPlaceCard[];
  total: number;
  loading: boolean;
  error: string | null;
  truncatedCandidates: boolean;
}

/**
 * Debounced place search. The request only fires after the query settles and
 * every earlier request is aborted, so typing never queues API calls.
 */
export const usePlaceSearch = (params: {
  query: string;
  filters: IPlaceFilters;
  sort: PlaceSort;
  origin: IUserPosition | null;
  enabled: boolean;
  refreshToken?: number;
}) => {
  const { query, sort, origin, enabled, refreshToken } = params;
  const key = filtersKey(params.filters);

  const [state, setState] = useState<ISearchState>({
    items: [],
    total: 0,
    loading: false,
    error: null,
    truncatedCandidates: false,
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: retry trigger
  useEffect(() => {
    const term = query.trim();

    if (!enabled || term.length === 0) {
      setState({
        items: [],
        total: 0,
        loading: false,
        error: null,
        truncatedCandidates: false,
      });
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setState((previous) => ({ ...previous, loading: true, error: null }));

      try {
        const filters = JSON.parse(key) as IPlaceFilters;
        const response = await searchPlaces(
          {
            query: term,
            filters,
            sort,
            origin,
          },
          controller.signal,
        );

        if (!response.success) {
          setState({
            items: [],
            total: 0,
            loading: false,
            error: response.message || "Search failed",
            truncatedCandidates: false,
          });
          return;
        }

        const meta = response.meta as
          | { total?: number; truncatedCandidates?: boolean }
          | undefined;

        setState({
          items: response.data ?? [],
          total: meta?.total ?? response.data?.length ?? 0,
          loading: false,
          error: null,
          truncatedCandidates: meta?.truncatedCandidates ?? false,
        });
      } catch (error) {
        if (isAbortError(error)) return;
        setState({
          items: [],
          total: 0,
          loading: false,
          error: error instanceof Error ? error.message : "Search failed",
          truncatedCandidates: false,
        });
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, sort, origin, enabled, key, refreshToken]);

  return state;
};

interface INearbyState {
  items: INearbyPlace[];
  loading: boolean;
  error: string | null;
}

/**
 * Nearby places around the user's position, used for the sidebar list and as a
 * radius-based alternative to viewport results.
 */
export const useNearbyPlaces = (params: {
  origin: IUserPosition | null;
  filters: IPlaceFilters;
  enabled: boolean;
  radius?: number;
  refreshToken?: number;
}) => {
  const { origin, enabled, radius, refreshToken } = params;
  const key = filtersKey(params.filters);

  const [state, setState] = useState<INearbyState>({
    items: [],
    loading: false,
    error: null,
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: retry trigger
  useEffect(() => {
    if (!enabled || !origin) {
      setState({ items: [], loading: false, error: null });
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setState((previous) => ({ ...previous, loading: true, error: null }));

      try {
        const filters = JSON.parse(key) as IPlaceFilters;
        const response = await nearbyPlaces(
          { origin, filters, radius },
          controller.signal,
        );

        if (!response.success) {
          setState({
            items: [],
            loading: false,
            error: response.message || "Unable to load nearby places",
          });
          return;
        }

        setState({
          items: response.data ?? [],
          loading: false,
          error: null,
        });
      } catch (error) {
        if (isAbortError(error)) return;
        setState({
          items: [],
          loading: false,
          error:
            error instanceof Error
              ? error.message
              : "Unable to load nearby places",
        });
      }
    }, EXPLORE_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [origin, enabled, key, radius, refreshToken]);

  return state;
};

/** Categories for the filter list (fetched once per mount). */
export const usePlaceCategories = () => {
  const [state, setState] = useState<{
    items: IPlaceCategory[];
    loading: boolean;
    error: string | null;
  }>({ items: [], loading: true, error: null });

  useEffect(() => {
    const controller = new AbortController();

    getPlaceCategories(controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return;
        setState({
          items: response.success ? (response.data ?? []) : [],
          loading: false,
          error: response.success ? null : response.message,
        });
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setState({
          items: [],
          loading: false,
          error: "Categories could not be loaded",
        });
      });

    return () => controller.abort();
  }, []);

  return state;
};
