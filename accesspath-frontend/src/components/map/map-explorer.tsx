"use client";

import { List, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  type IExplorerRoute,
  MapDirections,
} from "@/components/map/map-directions";
import type { IMapActions } from "@/components/map/map-view";
import { MapView } from "@/components/map/map-view";
import { Button } from "@/components/ui/button";
import {
  useMapLocations,
  useNearbyPlaces,
  usePlaceCategories,
  usePlaceSearch,
} from "@/hooks/use-map-locations";
import { useUserLocation } from "@/hooks/use-user-location";
import type { IMapViewport, IUserPosition } from "@/types/map.types";
import type {
  INearbyPlace,
  IPlaceCard,
  IPlaceFilters,
  IPlaceGeoFeature,
  PlaceSort,
} from "@/types/place.types";
import { emptyPlaceFilters } from "@/types/place.types";

import { LocationPopup } from "./location-popup";
import { MapControls } from "./map-controls";
import { MapSidebar } from "./map-sidebar";

const DEFAULT_NEARBY_RADIUS = 5_000;

const toFeature = (place: IPlaceCard): IPlaceGeoFeature => ({
  type: "Feature",
  geometry: {
    type: "Point",
    coordinates: [place.longitude, place.latitude],
  },
  properties: place,
});

const distanceOf = (
  place: IPlaceCard,
  origin: IUserPosition | null,
): number | null => {
  const nearbyDistance = (place as INearbyPlace).distanceMeters;
  if (typeof nearbyDistance === "number") return nearbyDistance;
  if (!origin) return null;

  const toRadians = (value: number) => (value * Math.PI) / 180;
  const deltaLat = toRadians(place.latitude - origin.latitude);
  const deltaLng = toRadians(place.longitude - origin.longitude);
  const h =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(origin.latitude)) *
      Math.cos(toRadians(place.latitude)) *
      Math.sin(deltaLng / 2) ** 2;

  return 2 * 6_371_000 * Math.asin(Math.min(1, Math.sqrt(h)));
};

/** Keeps unknown accessibility data last for every sort mode. */
const sortCards = <T extends IPlaceCard>(
  items: T[],
  sort: PlaceSort,
  origin: IUserPosition | null,
): T[] => {
  const sorted = [...items];

  if (sort === "nearest") {
    return sorted.sort((a, b) => {
      const distanceA = distanceOf(a, origin) ?? Number.POSITIVE_INFINITY;
      const distanceB = distanceOf(b, origin) ?? Number.POSITIVE_INFINITY;
      return distanceA - distanceB;
    });
  }

  if (sort === "recently_verified") {
    return sorted.sort((a, b) => {
      const stampA = a.verifiedAt ? Date.parse(a.verifiedAt) : 0;
      const stampB = b.verifiedAt ? Date.parse(b.verifiedAt) : 0;
      return stampB - stampA;
    });
  }

  return sorted.sort((a, b) => {
    const scoreA = a.accessibilityScore ?? -1;
    const scoreB = b.accessibilityScore ?? -1;
    if (scoreA !== scoreB) return scoreB - scoreA;
    return a.name.localeCompare(b.name);
  });
};

/**
 * AccessPath Map Explorer.
 *
 * Data flow: viewport/search/filters -> hooks -> services -> /api/geo proxy ->
 * Express. The map itself only renders GeoJSON; all interactions stay in React
 * state so the sidebar remains the accessible, keyboard-operable surface.
 */
export function MapExplorer() {
  const [filters, setFilters] = useState<IPlaceFilters>(emptyPlaceFilters);
  const [sort, setSort] = useState<PlaceSort>("score");
  const [query, setQuery] = useState("");
  const [viewport, setViewport] = useState<IMapViewport | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<IPlaceCard | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [directionsFor, setDirectionsFor] = useState<IPlaceCard | null>(null);
  const [pickingOrigin, setPickingOrigin] = useState(false);
  const [pickedOrigin, setPickedOrigin] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [explorerRoute, setExplorerRoute] = useState<IExplorerRoute | null>(
    null,
  );

  const handleRouteChange = useCallback((route: IExplorerRoute) => {
    setExplorerRoute(route);
  }, []);

  const closeDirections = useCallback(() => {
    setDirectionsFor(null);
    setExplorerRoute(null);
    setPickingOrigin(false);
    setPickedOrigin(null);
  }, []);

  const openDirections = useCallback((place: IPlaceCard) => {
    setDirectionsFor(place);
    setSelectedPlace(null);
    setSelectedId(null);
    setPanelOpen(false);
    setPickingOrigin(false);
    setPickedOrigin(null);
  }, []);

  const handlePickCoordinate = useCallback(
    (point: { latitude: number; longitude: number }) => {
      setPickedOrigin(point);
      setPickingOrigin(false);
    },
    [],
  );

  const mapActions = useRef<IMapActions | null>(null);
  const fittedQuery = useRef<string | null>(null);

  const userLocation = useUserLocation();
  const categories = usePlaceCategories();

  const searchTerm = query.trim();
  const searchActive = searchTerm.length > 0;
  const effectiveSort: PlaceSort =
    sort === "nearest" && !userLocation.position ? "score" : sort;

  const explore = useMapLocations({
    viewport,
    filters,
    enabled: !searchActive,
    refreshToken,
  });

  const search = usePlaceSearch({
    query: searchTerm,
    filters,
    sort: effectiveSort,
    origin: userLocation.position,
    enabled: searchActive,
    refreshToken,
  });

  const nearby = useNearbyPlaces({
    origin: userLocation.position,
    filters,
    enabled: !searchActive,
    radius: DEFAULT_NEARBY_RADIUS,
    refreshToken,
  });

  const mapFeatures = useMemo(
    () => (searchActive ? search.items.map(toFeature) : explore.features),
    [searchActive, search.items, explore.features],
  );

  const cards = useMemo(() => {
    if (searchActive) {
      return sortCards(search.items, effectiveSort, userLocation.position);
    }

    if (userLocation.position && !nearby.error) {
      return sortCards(nearby.items, sort, userLocation.position);
    }

    return sortCards(
      explore.features.map((feature) => feature.properties),
      sort,
      userLocation.position,
    );
  }, [
    searchActive,
    search.items,
    effectiveSort,
    userLocation.position,
    nearby.items,
    nearby.error,
    explore.features,
    sort,
  ]);

  const suggestions = useMemo(
    () => (searchActive && !search.loading ? search.items.slice(0, 5) : []),
    [searchActive, search.loading, search.items],
  );

  /**
   * Fit the map to search results once per completed query.
   */
  useEffect(() => {
    if (!searchActive || search.loading || search.items.length === 0) return;
    if (fittedQuery.current === searchTerm) return;

    fittedQuery.current = searchTerm;
    mapActions.current?.fitToFeatures(search.items.map(toFeature));
  }, [searchActive, search.loading, search.items, searchTerm]);

  const loading = searchActive ? search.loading : explore.loading;
  const error = searchActive ? search.error : (explore.error ?? nearby.error);

  const selectPlace = useCallback((place: IPlaceCard | null) => {
    // A selection always shows the detail card in place of the mobile list.
    setPanelOpen(false);
    setDirectionsFor(null);
    setExplorerRoute(null);
    setPickingOrigin(false);
    setPickedOrigin(null);

    if (!place) {
      setSelectedId(null);
      setSelectedPlace(null);
      return;
    }

    setSelectedId(place.id);
    setSelectedPlace(place);
    mapActions.current?.flyTo([place.longitude, place.latitude]);
  }, []);

  // Escape closes the mobile list overlay, mirroring a dialog.
  useEffect(() => {
    if (!panelOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanelOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [panelOpen]);

  const handleSelectById = useCallback(
    (placeId: string | null) => {
      if (!placeId) {
        selectPlace(null);
        return;
      }

      const fromCards = cards.find((card) => card.id === placeId);
      const fromMap = mapFeatures.find(
        (feature) => feature.properties.id === placeId,
      )?.properties;

      const place = fromCards ?? fromMap;
      if (place) selectPlace(place);
    },
    [cards, mapFeatures, selectPlace],
  );

  const handleFiltersChange = useCallback((next: IPlaceFilters) => {
    setFilters(next);
    setSelectedId(null);
    setSelectedPlace(null);
  }, []);

  const handleReset = useCallback(() => {
    setFilters(emptyPlaceFilters);
    setSort("score");
    setQuery("");
    setSelectedId(null);
    setSelectedPlace(null);
    fittedQuery.current = null;
  }, []);

  const handleLocate = useCallback(() => {
    if (userLocation.position) {
      mapActions.current?.centerOnUser();
      return;
    }
    userLocation.request();
  }, [userLocation]);

  const handleResetView = useCallback(() => {
    if (mapFeatures.length) {
      mapActions.current?.fitToFeatures(mapFeatures);
      return;
    }
    mapActions.current?.flyTo([90.4125, 23.7806], 12);
  }, [mapFeatures]);

  const handleSelectSuggestion = useCallback(
    (place: IPlaceCard) => {
      setQuery(place.name);
      selectPlace(place);
    },
    [selectPlace],
  );

  const handleViewportChange = useCallback((next: IMapViewport) => {
    setViewport(next);
  }, []);

  const listLabel = searchActive
    ? "Search results"
    : userLocation.position
      ? "Nearby places"
      : "Places in view";

  const listHint = searchActive
    ? `Matching “${searchTerm}”`
    : userLocation.position
      ? "Within 5 km of your location"
      : "Move or zoom the map to explore other areas";

  const sidebar = (idPrefix: string) => (
    <MapSidebar
      idPrefix={idPrefix}
      query={query}
      onQueryChange={setQuery}
      suggestions={suggestions}
      onSelectSuggestion={handleSelectSuggestion}
      filters={filters}
      sort={sort}
      categories={categories.items}
      categoriesLoading={categories.loading}
      hasUserLocation={Boolean(userLocation.position)}
      onFiltersChange={handleFiltersChange}
      onSortChange={setSort}
      onReset={handleReset}
      cards={cards}
      loading={loading}
      error={error}
      selectedId={selectedId}
      onSelect={handleSelectById}
      listLabel={listLabel}
      listHint={listHint}
      onRetry={() => setRefreshToken((token) => token + 1)}
    />
  );

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Rail on desktop, full-height map on mobile (list opens as a sheet). */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 lg:grid-cols-[21.5rem_minmax(0,1fr)]">
        <aside className="hidden min-h-0 overflow-hidden rounded-xl border border-border bg-card lg:flex lg:flex-col">
          {sidebar("map-desktop")}
        </aside>

        <div className="relative min-h-0 min-w-0 overflow-hidden rounded-xl border border-border bg-muted">
          <MapView
            ref={mapActions}
            features={mapFeatures}
            userPosition={userLocation.position}
            selectedId={selectedId}
            routePath={explorerRoute?.path ?? null}
            routeOrigin={explorerRoute?.origin ?? null}
            routeDestination={explorerRoute?.destination ?? null}
            picking={pickingOrigin}
            onPickCoordinate={handlePickCoordinate}
            onSelect={handleSelectById}
            onViewportChange={handleViewportChange}
          />

          <MapControls
            onLocate={handleLocate}
            onZoomIn={() => mapActions.current?.zoomIn()}
            onZoomOut={() => mapActions.current?.zoomOut()}
            onResetView={handleResetView}
            userStatus={userLocation.status}
            userError={userLocation.error}
            loading={loading}
            error={error}
            resultCount={
              searchActive
                ? search.items.length
                : (explore.meta?.returned ?? mapFeatures.length)
            }
            truncated={!searchActive && Boolean(explore.meta?.truncated)}
            label={searchActive ? "search results" : "places in view"}
            shiftsWithPanel={Boolean(directionsFor)}
          />

          {selectedPlace && (
            <LocationPopup
              place={selectedPlace}
              distanceMeters={distanceOf(selectedPlace, userLocation.position)}
              onDirections={openDirections}
              onClose={() => selectPlace(null)}
            />
          )}

          {directionsFor && (
            <MapDirections
              destination={directionsFor}
              userPosition={userLocation.position}
              userStatus={userLocation.status}
              userError={userLocation.error}
              onRequestLocation={() => userLocation.request()}
              picking={pickingOrigin}
              pickedOrigin={pickedOrigin}
              onPickOrigin={() => {
                setPickedOrigin(null);
                setPickingOrigin((open) => !open);
              }}
              onClose={closeDirections}
              onRouteChange={handleRouteChange}
            />
          )}

          {/* Mobile: the list floats over the map so the map keeps its height. */}
          {!selectedPlace && !directionsFor && !panelOpen && (
            <Button
              type="button"
              size="sm"
              onClick={() => setPanelOpen(true)}
              aria-expanded={panelOpen}
              aria-controls="map-mobile-panel"
              className="absolute bottom-3 left-3 z-20 rounded-full shadow-lg sm:left-1/2 sm:-translate-x-1/2 lg:hidden"
            >
              <List aria-hidden="true" className="size-3.5" />
              Places · {cards.length}
            </Button>
          )}

          {panelOpen && !selectedPlace && !directionsFor && (
            <div className="absolute inset-0 z-30 flex flex-col justify-end lg:hidden">
              <button
                type="button"
                aria-label="Close place list"
                onClick={() => setPanelOpen(false)}
                className="absolute inset-0 bg-background/50"
              />

              <div
                id="map-mobile-panel"
                className="relative flex max-h-[82%] min-h-0 flex-col overflow-hidden rounded-t-xl border-t border-border bg-card shadow-2xl"
              >
                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2">
                  <p className="text-sm font-semibold">{listLabel}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setPanelOpen(false)}
                    aria-label="Close place list"
                  >
                    <X aria-hidden="true" />
                  </Button>
                </div>

                <div className="min-h-0 flex-1">{sidebar("map-mobile")}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
