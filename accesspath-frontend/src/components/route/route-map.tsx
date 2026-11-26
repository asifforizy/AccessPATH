"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { Loader2 } from "lucide-react";
import type { GeoJSONSource, Map as MapLibreMap, Marker } from "maplibre-gl";
import type { RefObject } from "react";
import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { buildMapStyle, readMapPalette } from "@/components/map/map-markers";
import { loadMapLibre } from "@/lib/maplibre";
import type { IRoutePoint, PickKind } from "@/types/route.types";

const ROUTE_SOURCE = "route-line";
const ROUTE_CASING_LAYER = "route-line-casing";
const ROUTE_LAYER = "route-line";

const DEFAULT_CENTER: [number, number] = [90.4125, 23.7806];
const DEFAULT_ZOOM = 12;
const DESTINATION_COLOR = "#e11d48";

type LatLng = { latitude: number; longitude: number };

export interface IRouteMapActions {
  /** Zoom to the whole route (or both endpoints). */
  fitAll: () => void;
  /** Centre on a single coordinate without zooming out. */
  focus: (point: LatLng) => void;
}

interface RouteMapProps {
  origin: IRoutePoint | null;
  destination: IRoutePoint | null;
  /** Street-level path when available (see /api/route-path). */
  path: LatLng[] | null;
  /** Scored corridor waypoints, used when no street path is available. */
  waypoints: LatLng[];
  picking: PickKind | null;
  userPosition: LatLng | null;
  onPick: (kind: PickKind, point: LatLng) => void;
  ref?: React.Ref<IRouteMapActions>;
}

const emptyLine = {
  type: "Feature" as const,
  properties: {},
  geometry: {
    type: "LineString" as const,
    coordinates: [] as Array<[number, number]>,
  },
};

const lineFeature = (waypoints: LatLng[]) => ({
  type: "Feature" as const,
  properties: {},
  geometry: {
    type: "LineString" as const,
    coordinates: waypoints.map(
      (point) => [point.longitude, point.latitude] as [number, number],
    ),
  },
});

const round = (value: number) => Number(value.toFixed(6));

/**
 * Map for the route planner.
 *
 * Clicking the map drops the endpoint the user is currently picking, and the
 * markers stay draggable so a coordinate can be fine-tuned without typing it.
 */
export function RouteMap({
  origin,
  destination,
  path,
  waypoints,
  picking,
  userPosition,
  onPick,
  ref,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const moduleRef = useRef<typeof import("maplibre-gl") | null>(null);
  const originMarkerRef = useRef<Marker | null>(null);
  const destinationMarkerRef = useRef<Marker | null>(null);
  const userMarkerRef = useRef<Marker | null>(null);
  const loadedRef = useRef(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  const callbacksRef = useRef({ onPick, picking });
  callbacksRef.current = { onPick, picking };

  const fitTo = useCallback((points: LatLng[]) => {
    const map = mapRef.current;
    if (!map || points.length === 0) return;

    if (points.length === 1) {
      const only = points[0] as LatLng;
      map.easeTo({
        center: [only.longitude, only.latitude],
        zoom: 15,
        duration: 700,
      });
      return;
    }

    const lngs = points.map((point) => point.longitude);
    const lats = points.map((point) => point.latitude);
    const pad = 0.0012;

    map.fitBounds(
      [
        [Math.min(...lngs) - pad, Math.min(...lats) - pad],
        [Math.max(...lngs) + pad, Math.max(...lats) + pad],
      ],
      { padding: 56, maxZoom: 16, duration: 800 },
    );
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      fitAll: () => {
        const endpoints = [origin, destination].filter(
          (point): point is IRoutePoint => point !== null,
        );
        fitTo(endpoints.length > 0 ? endpoints : waypoints);
      },
      focus: (point) => {
        const map = mapRef.current;
        if (!map) return;
        map.easeTo({
          center: [point.longitude, point.latitude],
          zoom: Math.max(map.getZoom(), 14),
          duration: 700,
        });
      },
    }),
    [fitTo, origin, destination, waypoints],
  );

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    let observer: ResizeObserver | null = null;

    const setup = async () => {
      if (!containerRef.current || mapRef.current) return;

      const maplibregl = await loadMapLibre();
      if (cancelled || !containerRef.current) return;

      moduleRef.current = maplibregl;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: buildMapStyle(),
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        attributionControl: { compact: true },
      });
      mapRef.current = map;

      // Dev-only handle for inspecting the live map (used by tests).
      if (process.env.NODE_ENV !== "production") {
        (
          window as unknown as { __accessPathRouteMap?: MapLibreMap }
        ).__accessPathRouteMap = map;
      }

      map.on("load", () => {
        if (cancelled) return;
        const palette = readMapPalette();

        map.addSource(ROUTE_SOURCE, {
          type: "geojson",
          data: emptyLine as never,
        });

        map.addLayer({
          id: ROUTE_CASING_LAYER,
          type: "line",
          source: ROUTE_SOURCE,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": palette.background,
            "line-width": 8,
            "line-opacity": 0.7,
          },
        });

        map.addLayer({
          id: ROUTE_LAYER,
          type: "line",
          source: ROUTE_SOURCE,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: { "line-color": palette.primary, "line-width": 4.5 },
        });

        loadedRef.current = true;
        setStatus("ready");
      });

      map.on("error", () => {
        if (!loadedRef.current) setStatus("error");
      });

      map.on("click", (event) => {
        const active = callbacksRef.current.picking;
        if (!active) return;
        callbacksRef.current.onPick(active, {
          latitude: round(event.lngLat.lat),
          longitude: round(event.lngLat.lng),
        });
      });

      observer = new ResizeObserver(() => map.resize());
      observer.observe(containerRef.current);
    };

    setup();

    return () => {
      cancelled = true;
      observer?.disconnect();
      originMarkerRef.current?.remove();
      destinationMarkerRef.current?.remove();
      userMarkerRef.current?.remove();
      originMarkerRef.current = null;
      destinationMarkerRef.current = null;
      userMarkerRef.current = null;
      mapRef.current?.remove();
      mapRef.current = null;
      loadedRef.current = false;
    };
  }, []);

  // Route line: prefer the street path, fall back to the scored corridor.
  // biome-ignore lint/correctness/useExhaustiveDependencies: fitTo is stable and reads the map ref
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !loadedRef.current) return;

    const line = path && path.length >= 2 ? path : waypoints;
    const source = map.getSource(ROUTE_SOURCE) as GeoJSONSource | undefined;
    source?.setData(lineFeature(line) as never);

    if (line.length >= 2) fitTo(line);
  }, [path, waypoints, status, fitTo]);

  // Endpoint markers (draggable).
  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = moduleRef.current;
    if (!map || !maplibregl || status !== "ready") return;

    const palette = readMapPalette();

    const sync = (
      point: IRoutePoint | null,
      kind: PickKind,
      markerRef: RefObject<Marker | null>,
    ) => {
      const existing = markerRef.current;

      if (!point) {
        existing?.remove();
        markerRef.current = null;
        return;
      }

      const coordinates: [number, number] = [point.longitude, point.latitude];

      if (existing) {
        existing.setLngLat(coordinates);
        return;
      }

      const marker = new maplibregl.Marker({
        draggable: true,
        color: kind === "origin" ? palette.primary : DESTINATION_COLOR,
      })
        .setLngLat(coordinates)
        .addTo(map);

      marker.on("dragend", () => {
        const next = marker.getLngLat();
        callbacksRef.current.onPick(kind, {
          latitude: round(next.lat),
          longitude: round(next.lng),
        });
      });

      markerRef.current = marker;
    };

    sync(origin, "origin", originMarkerRef);
    sync(destination, "destination", destinationMarkerRef);
  }, [origin, destination, status]);

  // Current position, for orientation only.
  useEffect(() => {
    const map = mapRef.current;
    const maplibregl = moduleRef.current;
    if (!map || !maplibregl || status !== "ready") return;

    if (!userPosition) {
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      return;
    }

    const coordinates: [number, number] = [
      userPosition.longitude,
      userPosition.latitude,
    ];

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat(coordinates);
      return;
    }

    userMarkerRef.current = new maplibregl.Marker({
      color: readMapPalette().mutedForeground,
    })
      .setLngLat(coordinates)
      .addTo(map);
  }, [userPosition, status]);

  // Crosshair while picking.
  useEffect(() => {
    const canvas = mapRef.current?.getCanvas();
    if (!canvas) return;
    canvas.style.cursor = picking ? "crosshair" : "";
  }, [picking]);

  return (
    <div className="relative h-full w-full overflow-hidden">
      <section
        ref={containerRef}
        className="h-full w-full bg-muted"
        aria-label="Map for choosing route start and destination"
      />

      {status === "loading" && (
        <div className="absolute inset-0 grid place-items-center bg-background/50">
          <p className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm text-muted-foreground shadow-sm">
            <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
            Loading map…
          </p>
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 grid place-items-center p-6">
          <p
            role="alert"
            className="rounded-lg border border-border bg-card p-4 text-sm"
          >
            The map could not be loaded. You can still search for both places
            above.
          </p>
        </div>
      )}

      <p className="sr-only">
        Use the search fields to choose a start and destination, or activate
        “pick on map” and click here.
      </p>
    </div>
  );
}
