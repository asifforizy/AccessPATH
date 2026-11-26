"use client";

import "maplibre-gl/dist/maplibre-gl.css";

import { Crosshair, Loader2 } from "lucide-react";
import type { Map as MapLibreMap, Marker } from "maplibre-gl";
import { useEffect, useRef, useState } from "react";
import { buildMapStyle, readMapPalette } from "@/components/map/map-markers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadMapLibre } from "@/lib/maplibre";

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (value: { latitude: number; longitude: number }) => void;
}

/**
 * Click-to-place coordinate picker. Used when submitting a new location or
 * reporting a barrier, so GPS data is captured properly instead of typed blind.
 */
export function LocationPicker({
  latitude,
  longitude,
  onChange,
}: LocationPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [locating, setLocating] = useState(false);

  // Initial coordinates are captured once; updates are applied by the effect below.
  // biome-ignore lint/correctness/useExhaustiveDependencies: init-only
  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      if (!containerRef.current || mapRef.current) return;

      const maplibregl = await loadMapLibre();
      if (cancelled || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: buildMapStyle(),
        center: [longitude ?? 90.4125, latitude ?? 23.7806],
        zoom: 14,
        attributionControl: { compact: true },
      });
      mapRef.current = map;

      map.on("load", () => {
        if (cancelled) return;
        setStatus("ready");

        const palette = readMapPalette();
        const marker = new maplibregl.Marker({
          color: palette.primary,
          draggable: true,
        })
          .setLngLat([longitude ?? 90.4125, latitude ?? 23.7806])
          .addTo(map);

        marker.on("dragend", () => {
          const point = marker.getLngLat();
          onChangeRef.current({
            latitude: Number(point.lat.toFixed(6)),
            longitude: Number(point.lng.toFixed(6)),
          });
        });

        markerRef.current = marker;
      });

      map.on("click", (event) => {
        const point = markerRef.current?.getLngLat();
        const next = {
          latitude: Number(event.lngLat.lat.toFixed(6)),
          longitude: Number(event.lngLat.lng.toFixed(6)),
        };
        onChangeRef.current(next);
        if (markerRef.current) {
          markerRef.current.setLngLat([next.longitude, next.latitude]);
        } else if (point) {
          // no-op: marker appears after load
        }
      });

      map.on("error", () => setStatus("error"));
    };

    setup();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // init only
  }, []);

  // Keep the marker in sync when coordinates change from outside.
  useEffect(() => {
    if (
      !markerRef.current ||
      typeof latitude !== "number" ||
      typeof longitude !== "number"
    ) {
      return;
    }
    markerRef.current.setLngLat([longitude, latitude]);
    mapRef.current?.panTo([longitude, latitude]);
  }, [latitude, longitude]);

  const locate = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false);
        const next = {
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
        };
        onChangeRef.current(next);
        markerRef.current?.setLngLat([next.longitude, next.latitude]);
        mapRef.current?.flyTo({
          center: [next.longitude, next.latitude],
          zoom: 16,
        });
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  return (
    <div className="space-y-2">
      <div className="relative h-56 overflow-hidden rounded-lg border border-border">
        <section
          ref={containerRef}
          aria-label="Map to choose coordinates"
          className="size-full bg-muted"
        />
        {status === "loading" && (
          <p className="absolute inset-0 flex items-center justify-center bg-background/60 text-xs text-muted-foreground">
            Loading map…
          </p>
        )}
        {status === "error" && (
          <p className="absolute inset-0 flex items-center justify-center bg-background/80 p-4 text-center text-xs">
            Map tiles unavailable — enter coordinates manually below.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label htmlFor="picker-latitude" className="flex-1 text-xs">
          <span className="mb-1 block text-muted-foreground">Latitude</span>
          <Input
            id="picker-latitude"
            type="number"
            step="0.000001"
            min={-90}
            max={90}
            value={latitude ?? ""}
            onChange={(event) =>
              onChange({
                latitude: Number(event.target.value),
                longitude: longitude ?? 0,
              })
            }
            required
            className="h-8"
          />
        </label>
        <label htmlFor="picker-longitude" className="flex-1 text-xs">
          <span className="mb-1 block text-muted-foreground">Longitude</span>
          <Input
            id="picker-longitude"
            type="number"
            step="0.000001"
            min={-180}
            max={180}
            value={longitude ?? ""}
            onChange={(event) =>
              onChange({
                latitude: latitude ?? 0,
                longitude: Number(event.target.value),
              })
            }
            required
            className="h-8"
          />
        </label>
        <Button type="button" variant="outline" size="sm" onClick={locate}>
          {locating ? (
            <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
          ) : (
            <Crosshair aria-hidden="true" className="size-3.5" />
          )}
          Use my location
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Click the map or drag the pin to set the exact position.
      </p>
    </div>
  );
}
