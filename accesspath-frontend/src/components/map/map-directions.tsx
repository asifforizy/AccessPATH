"use client";

import {
  Accessibility,
  Bike,
  Car,
  ExternalLink,
  Footprints,
  Info,
  Loader2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { RouteEndpointPicker } from "@/components/route/route-endpoint-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { osmDirectionsUrl } from "@/lib/geo";
import { cn } from "@/lib/utils";
import { planRoute } from "@/services/routes";
import type { UserLocationStatus } from "@/types/map.types";
import type { IPlaceCard } from "@/types/place.types";
import type { IRoutePoint, TravelMode } from "@/types/route.types";
import type { IRouteOption } from "@/utils/types";

type LatLng = { latitude: number; longitude: number };

export interface IExplorerRoute {
  path: LatLng[] | null;
  origin: LatLng | null;
  destination: LatLng | null;
}

const travelModes: Array<{
  value: TravelMode;
  label: string;
  icon: typeof Accessibility;
}> = [
  { value: "WHEELCHAIR", label: "Wheelchair", icon: Accessibility },
  { value: "WALKING", label: "Walk", icon: Footprints },
  { value: "CYCLING", label: "Bike", icon: Bike },
  { value: "DRIVING", label: "Drive", icon: Car },
];

interface MapDirectionsProps {
  /** Place picked on the map — always the destination of this query. */
  destination: IPlaceCard;
  userPosition: LatLng | null;
  userStatus: UserLocationStatus;
  userError: string | null;
  onRequestLocation: () => void;
  picking: boolean;
  pickedOrigin: LatLng | null;
  onPickOrigin: () => void;
  onClose: () => void;
  onRouteChange: (route: IExplorerRoute) => void;
}

/**
 * In-map directions. Mirrors the /routes planner without leaving the explorer:
 * choose a start (search, current location or a map click), rank the accessible
 * options and draw the street path on the same map.
 */
export function MapDirections({
  destination,
  userPosition,
  userStatus,
  userError,
  onRequestLocation,
  picking,
  pickedOrigin,
  onPickOrigin,
  onClose,
  onRouteChange,
}: MapDirectionsProps) {
  const destinationPoint = useMemo<IRoutePoint>(
    () => ({
      id: destination.id,
      name: destination.name,
      latitude: destination.latitude,
      longitude: destination.longitude,
    }),
    [destination],
  );

  const [origin, setOrigin] = useState<IRoutePoint | null>(() =>
    userPosition
      ? {
          name: "My location",
          latitude: userPosition.latitude,
          longitude: userPosition.longitude,
        }
      : null,
  );
  const [travelMode, setTravelMode] = useState<TravelMode>("WHEELCHAIR");
  const [options, setOptions] = useState<IRouteOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [planning, setPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paths, setPaths] = useState<LatLng[][]>([]);
  const [pathStatus, setPathStatus] = useState<
    "idle" | "loading" | "ready" | "unavailable"
  >("idle");

  const selected = useMemo(
    () =>
      options.find((option) => option.id === selectedId) ?? options[0] ?? null,
    [options, selectedId],
  );
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.id === selected?.id),
  );
  const activePath = paths[selectedIndex] ?? paths[0] ?? null;

  // Adopt the current position as the start as soon as it is known.
  useEffect(() => {
    if (origin || !userPosition) return;
    setOrigin({
      name: "My location",
      latitude: userPosition.latitude,
      longitude: userPosition.longitude,
    });
  }, [origin, userPosition]);

  // A coordinate picked on the map becomes the start.
  useEffect(() => {
    if (!pickedOrigin) return;
    setOrigin({ name: "Pinned start", ...pickedOrigin });
  }, [pickedOrigin]);

  // Street-level path for the preview.
  useEffect(() => {
    if (!origin) {
      setPaths([]);
      setPathStatus("idle");
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setPathStatus("loading");
      const params = new URLSearchParams({
        originLat: String(origin.latitude),
        originLng: String(origin.longitude),
        destinationLat: String(destinationPoint.latitude),
        destinationLng: String(destinationPoint.longitude),
        mode: travelMode,
      });

      try {
        const response = await fetch(`/api/route-path?${params.toString()}`, {
          signal: controller.signal,
        });
        const body = (await response.json().catch(() => null)) as {
          success?: boolean;
          paths?: Array<{ coordinates: LatLng[] }>;
        } | null;
        const list = response.ok && body?.success ? (body.paths ?? []) : [];

        setPaths(list.map((entry) => entry.coordinates));
        setPathStatus(list.length > 0 ? "ready" : "unavailable");
      } catch {
        if (!controller.signal.aborted) {
          setPaths([]);
          setPathStatus("unavailable");
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [origin, destinationPoint, travelMode]);

  // Hand the drawn line to the parent map.
  useEffect(() => {
    onRouteChange({
      path: activePath,
      origin: origin
        ? { latitude: origin.latitude, longitude: origin.longitude }
        : null,
      destination: {
        latitude: destinationPoint.latitude,
        longitude: destinationPoint.longitude,
      },
    });
  }, [activePath, origin, destinationPoint, onRouteChange]);

  useEffect(
    () => () => onRouteChange({ path: null, origin: null, destination: null }),
    [onRouteChange],
  );

  const findRoutes = useCallback(async () => {
    if (!origin) {
      setError("Choose a starting point first.");
      return;
    }

    setPlanning(true);
    setError(null);

    try {
      const response = await planRoute({
        origin: {
          name: origin.name,
          latitude: origin.latitude,
          longitude: origin.longitude,
        },
        destination: {
          name: destinationPoint.name,
          latitude: destinationPoint.latitude,
          longitude: destinationPoint.longitude,
        },
        travelMode,
        accessibilityRequirements: { avoidStairs: true },
        save: false,
      });

      if (!response.success || !response.data) {
        setError(response.message || "Routes could not be planned");
        return;
      }

      const data = response.data;
      const ranked: IRouteOption[] = data.alternatives.map((summary) => ({
        ...summary,
        travelMode: data.travelMode,
      }));

      setOptions(ranked);
      setSelectedId(ranked[0]?.id ?? null);

      if (ranked.length === 0) {
        setError("No accessible route was found between these points.");
      }
    } finally {
      setPlanning(false);
    }
  }, [origin, destinationPoint, travelMode]);

  const externalDirections = osmDirectionsUrl(
    destinationPoint.latitude,
    destinationPoint.longitude,
  );

  return (
    <aside
      aria-label={`Directions to ${destination.name}`}
      className="absolute inset-x-3 bottom-3 z-30 flex max-h-[78%] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl sm:inset-x-auto sm:top-3 sm:right-3 sm:bottom-3 sm:w-[21rem]"
    >
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Directions to
          </p>
          <p className="truncate text-sm font-semibold">{destination.name}</p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close directions"
        >
          <X aria-hidden="true" />
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        <RouteEndpointPicker
          label="From"
          accent="origin"
          placeholder="Search a starting place"
          point={origin}
          onSelect={(point) => setOrigin(point)}
          onClear={() => {
            setOrigin(null);
            setOptions([]);
            setSelectedId(null);
          }}
          onUseMyLocation={onRequestLocation}
          locating={userStatus === "requesting"}
          onTogglePick={onPickOrigin}
          picking={picking}
        />

        {picking && (
          <p className="rounded-md border border-primary/40 bg-primary/10 px-2 py-1 text-xs">
            Click anywhere on the map to set your starting point.
          </p>
        )}

        {userError && (
          <p className="text-xs text-muted-foreground">{userError}</p>
        )}

        <fieldset className="space-y-1.5">
          <legend className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            Travel mode
          </legend>
          <div className="grid grid-cols-4 gap-1">
            {travelModes.map((mode) => {
              const Icon = mode.icon;
              const active = travelMode === mode.value;
              return (
                <Button
                  key={mode.value}
                  type="button"
                  size="icon-sm"
                  variant={active ? "secondary" : "outline"}
                  aria-pressed={active}
                  title={mode.label}
                  aria-label={mode.label}
                  onClick={() => setTravelMode(mode.value)}
                  className={cn("w-full", active && "ring-1 ring-primary/40")}
                >
                  <Icon aria-hidden="true" />
                </Button>
              );
            })}
          </div>
        </fieldset>

        <Button
          type="button"
          size="sm"
          className="w-full"
          onClick={findRoutes}
          disabled={!origin || planning}
        >
          {planning ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : (
            <Accessibility aria-hidden="true" />
          )}
          Find accessible routes
        </Button>

        {error && (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-xs text-destructive"
          >
            {error}
          </p>
        )}

        {planning && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 aria-hidden="true" className="size-3 animate-spin" />
            Scoring accessibility along the corridor…
          </p>
        )}

        {options.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              {options.length} option{options.length === 1 ? "" : "s"}
            </p>

            {options.map((option, index) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setSelectedId(option.id)}
                aria-pressed={option.id === selected?.id}
                className={cn(
                  "w-full rounded-lg border px-2.5 py-2 text-left text-xs transition-colors",
                  option.id === selected?.id
                    ? "border-primary bg-muted"
                    : "border-border hover:bg-muted",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  {option.recommended ? (
                    <Badge variant="success">Recommended</Badge>
                  ) : (
                    <span className="font-medium">Option {index + 1}</span>
                  )}
                  <span className="font-semibold tabular-nums">
                    {option.accessibilityScore}
                    <span className="text-[10px] font-normal text-muted-foreground">
                      /100
                    </span>
                  </span>
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-1.5 text-muted-foreground">
                  <span>
                    {option.distanceText} · {option.durationText}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Grade {option.grade}</span>
                </span>
              </button>
            ))}
          </div>
        )}

        {pathStatus === "unavailable" && (
          <p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
            <Info aria-hidden="true" className="mt-0.5 size-3 shrink-0" />
            Street path is unavailable right now, so no line is drawn on the
            map.
          </p>
        )}

        {externalDirections && (
          <a
            href={externalDirections}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between gap-2 border-t border-border pt-2 text-[11px] text-muted-foreground hover:text-foreground"
          >
            Open these directions in OpenStreetMap
            <ExternalLink aria-hidden="true" className="size-3" />
          </a>
        )}
      </div>
    </aside>
  );
}
