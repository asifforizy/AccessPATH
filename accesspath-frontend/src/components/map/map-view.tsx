"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import type {
  GeoJSONSource,
  MapLayerMouseEvent,
  Map as MapLibreMap,
} from "maplibre-gl";
import { useEffect, useImperativeHandle, useRef, useState } from "react";

import type { IMapViewport, IUserPosition } from "@/types/map.types";
import type { IPlaceGeoFeature } from "@/types/place.types";

import {
  ACCURACY_SOURCE_ID,
  accuracySource,
  applySelection,
  buildLayers,
  buildMapStyle,
  emptyFeatureCollection,
  loadMarkerImages,
  PLACE_SOURCE_ID,
  placesSource,
  readMapPalette,
  USER_SOURCE_ID,
  userSource,
} from "./map-markers";

export interface IMapActions {
  flyTo: (coordinates: [number, number], zoom?: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  fitToFeatures: (features: IPlaceGeoFeature[]) => void;
  centerOnUser: () => void;
}

interface MapViewProps {
  features: IPlaceGeoFeature[];
  userPosition: IUserPosition | null;
  selectedId: string | null;
  initialCenter?: [number, number];
  initialZoom?: number;
  onSelect: (placeId: string | null) => void;
  onViewportChange: (viewport: IMapViewport) => void;
  ref?: React.Ref<IMapActions>;
}

const DEFAULT_CENTER: [number, number] = [90.4125, 23.7806];
const DEFAULT_ZOOM = 12;

const viewportOf = (map: MapLibreMap): IMapViewport => {
  const bounds = map.getBounds();

  return {
    north: bounds.getNorth(),
    south: bounds.getSouth(),
    east: bounds.getEast(),
    west: bounds.getWest(),
    zoom: map.getZoom(),
  };
};

export function MapView({
  features,
  userPosition,
  selectedId,
  initialCenter = DEFAULT_CENTER,
  initialZoom = DEFAULT_ZOOM,
  onSelect,
  onViewportChange,
  ref,
}: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const loadedRef = useRef(false);
  const centeredOnUserRef = useRef(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  // Keep the latest callbacks without rebuilding the map.
  const callbacksRef = useRef({ onSelect, onViewportChange });
  callbacksRef.current = { onSelect, onViewportChange };

  const paletteRef = useRef(readMapPalette());

  useImperativeHandle(
    ref,
    () => ({
      flyTo: (coordinates, zoom) => {
        mapRef.current?.flyTo({
          center: coordinates,
          zoom: zoom ?? Math.max(mapRef.current.getZoom(), 15),
          duration: 900,
        });
      },
      zoomIn: () => mapRef.current?.zoomIn(),
      zoomOut: () => mapRef.current?.zoomOut(),
      fitToFeatures: (items) => {
        const map = mapRef.current;
        const coordinates = items.map((item) => item.geometry.coordinates);
        if (!map || coordinates.length === 0) return;

        if (coordinates.length === 1) {
          const [longitude, latitude] = coordinates[0] ?? [0, 0];
          map.flyTo({ center: [longitude, latitude], zoom: 15 });
          return;
        }

        let west = Number.POSITIVE_INFINITY;
        let south = Number.POSITIVE_INFINITY;
        let east = Number.NEGATIVE_INFINITY;
        let north = Number.NEGATIVE_INFINITY;

        for (const [longitude, latitude] of coordinates) {
          west = Math.min(west, longitude);
          south = Math.min(south, latitude);
          east = Math.max(east, longitude);
          north = Math.max(north, latitude);
        }

        map.fitBounds(
          [
            [west, south],
            [east, north],
          ],
          { padding: 64, maxZoom: 15, duration: 800 },
        );
      },
      centerOnUser: () => {
        if (!userPosition) return;
        mapRef.current?.flyTo({
          center: [userPosition.longitude, userPosition.latitude],
          zoom: 15,
          duration: 900,
        });
      },
    }),
    [userPosition],
  );

  // Initial values are read once; later changes flow through the effects below.
  const initialRef = useRef({ features, initialCenter, initialZoom });

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | null = null;

    const setup = async () => {
      if (!containerRef.current || mapRef.current) return;

      const maplibregl = await import("maplibre-gl");
      if (cancelled || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: buildMapStyle(),
        center: initialRef.current.initialCenter,
        zoom: initialRef.current.initialZoom,
        attributionControl: { compact: true },
        cooperativeGestures: false,
      });

      mapRef.current = map;

      map.on("load", async () => {
        if (cancelled) return;

        const palette = readMapPalette();
        paletteRef.current = palette;

        await loadMarkerImages(map, palette);
        if (cancelled) return;

        map.addSource(
          PLACE_SOURCE_ID,
          placesSource(initialRef.current.features),
        );
        map.addSource(
          USER_SOURCE_ID,
          userSource({ latitude: 0, longitude: 0 }),
        );
        map.addSource(
          ACCURACY_SOURCE_ID,
          accuracySource({ latitude: 0, longitude: 0, accuracy: 25 }),
        );

        for (const layer of buildLayers(palette)) {
          map.addLayer(layer);
        }

        for (const layerId of ["user-dot", "user-accuracy"]) {
          map.setLayoutProperty(layerId, "visibility", "none");
        }
        loadedRef.current = true;
        setStatus("ready");
        callbacksRef.current.onViewportChange(viewportOf(map));
      });

      map.on("error", () => {
        if (!loadedRef.current) setStatus("error");
      });

      map.on("moveend", () => {
        callbacksRef.current.onViewportChange(viewportOf(map));
      });

      map.on("click", "places-clusters", async (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        const clusterId = feature?.properties?.cluster_id;

        if (typeof clusterId !== "number") return;

        const source = map.getSource(PLACE_SOURCE_ID) as
          | GeoJSONSource
          | undefined;
        if (!source?.getClusterExpansionZoom) return;

        const zoom = await source.getClusterExpansionZoom(clusterId);
        const coordinates = (feature?.geometry as GeoJSON.Point).coordinates;

        map.easeTo({
          center: [coordinates[0] ?? 0, coordinates[1] ?? 0],
          zoom,
          duration: 600,
        });
      });

      map.on("click", "place-markers", (event: MapLayerMouseEvent) => {
        const placeId = event.features?.[0]?.properties?.id;
        if (typeof placeId === "string") {
          callbacksRef.current.onSelect(placeId);
        }
      });

      map.on("click", (event: MapLayerMouseEvent) => {
        const hit = map.queryRenderedFeatures(event.point, {
          layers: ["place-markers", "places-clusters"],
        });
        if (hit.length === 0) callbacksRef.current.onSelect(null);
      });

      for (const layerId of ["places-clusters", "place-markers"]) {
        map.on("mouseenter", layerId, () => {
          map.getCanvas().style.cursor = "pointer";
        });
        map.on("mouseleave", layerId, () => {
          map.getCanvas().style.cursor = "";
        });
      }

      observer = new ResizeObserver(() => map.resize());
      observer.observe(containerRef.current);
    };

    setup();

    return () => {
      cancelled = true;
      observer?.disconnect();
      mapRef.current?.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
    // The map is created once; dynamic props are applied in effects below.
  }, []);

  // Push new features into the map without recreating the source.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;

    const source = map.getSource(PLACE_SOURCE_ID) as GeoJSONSource | undefined;
    source?.setData({
      type: "FeatureCollection",
      features,
    });
  }, [features]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current || status !== "ready") return;

    applySelection(map, selectedId);
  }, [selectedId, status]);

  // User position: accuracy halo + dot, and center on first fix.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;

    const userSourceInstance = map.getSource(USER_SOURCE_ID) as
      | GeoJSONSource
      | undefined;
    const accuracySourceInstance = map.getSource(ACCURACY_SOURCE_ID) as
      | GeoJSONSource
      | undefined;

    if (!userPosition) {
      userSourceInstance?.setData(emptyFeatureCollection as never);
      accuracySourceInstance?.setData(emptyFeatureCollection as never);
      for (const layerId of ["user-dot", "user-accuracy"]) {
        map.setLayoutProperty(layerId, "visibility", "none");
      }
      return;
    }

    userSourceInstance?.setData(userSource(userPosition).data as never);
    accuracySourceInstance?.setData(accuracySource(userPosition).data as never);

    for (const layerId of ["user-dot", "user-accuracy"]) {
      map.setLayoutProperty(layerId, "visibility", "visible");
    }

    if (!centeredOnUserRef.current) {
      centeredOnUserRef.current = true;
      map.flyTo({
        center: [userPosition.longitude, userPosition.latitude],
        zoom: 15,
        duration: 900,
      });
    }
  }, [userPosition]);

  // Follow theme changes (class toggle or OS color scheme).
  useEffect(() => {
    const applyPalette = () => {
      const map = mapRef.current;
      if (!map || !loadedRef.current) return;

      const palette = readMapPalette();
      paletteRef.current = palette;

      loadMarkerImages(map, palette).catch(() => undefined);

      for (const layer of buildLayers(palette)) {
        for (const [property, value] of Object.entries(layer.paint ?? {})) {
          if (map.getLayer(layer.id)) {
            map.setPaintProperty(layer.id, property as never, value as never);
          }
        }
        if (layer.layout) {
          for (const [property, value] of Object.entries(layer.layout)) {
            if (
              map.getLayer(layer.id) &&
              property !== "icon-image" &&
              property !== "text-field"
            ) {
              map.setLayoutProperty(
                layer.id,
                property as never,
                value as never,
              );
            }
          }
        }
      }
    };

    const observer = new MutationObserver(applyPalette);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", applyPalette);

    return () => {
      observer.disconnect();
      media.removeEventListener("change", applyPalette);
    };
  }, []);

  return (
    <div className="relative size-full">
      <section
        ref={containerRef}
        className="size-full bg-muted"
        aria-label="Interactive map of accessible places"
      />

      <p className="sr-only">
        The map shows accessible places as markers. Use the place list beside
        the map to browse the same locations with a keyboard or screen reader.
      </p>

      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
          <p className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
            Loading map…
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/75 p-6">
          <p
            role="alert"
            className="max-w-sm rounded-lg border border-border bg-card p-4 text-sm"
          >
            The map tiles could not be loaded. Check your connection and reload
            the page — the place list is still available.
          </p>
        </div>
      )}
    </div>
  );
}
