"use client";

import {
  Accessibility,
  AlertTriangle,
  ArrowUpDown,
  Bike,
  Car,
  Footprints,
  Info,
  Loader2,
  Maximize2,
  Route as RouteIcon,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { RouteEndpointPicker } from "@/components/route/route-endpoint-picker";
import { type IRouteMapActions, RouteMap } from "@/components/route/route-map";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useUserLocation } from "@/hooks/use-user-location";
import { cn } from "@/lib/utils";
import {
  getRouteAccessibility,
  getRouteBarriers,
  planRoute,
  scoreRoute,
  submitRouteFeedback,
  validateRoute,
} from "@/services/routes";
import type { IRoutePoint, PickKind, TravelMode } from "@/types/route.types";
import type { IPlanRouteResult, IRouteOption } from "@/utils/types";

import { RouteOptionCard } from "./route-option-card";

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

const requirementFields = [
  { key: "avoidStairs", label: "Avoid stairs" },
  { key: "requireElevator", label: "Require elevator" },
  { key: "requireRestroom", label: "Restroom nearby" },
  { key: "requireParking", label: "Parking nearby" },
  { key: "avoidUnsafeCrossings", label: "Avoid unsafe crossings" },
] as const;

type LatLng = { latitude: number; longitude: number };

const coordinateLabel = (point: IRoutePoint) =>
  `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`;

const keyOf = (
  origin: IRoutePoint | null,
  destination: IRoutePoint | null,
  mode: TravelMode,
  requirements: Record<string, boolean>,
) =>
  origin && destination
    ? `${coordinateLabel(origin)}|${coordinateLabel(destination)}|${mode}|${JSON.stringify(requirements)}`
    : null;

export function RoutePlanner() {
  const [origin, setOrigin] = useState<IRoutePoint | null>(null);
  const [destination, setDestination] = useState<IRoutePoint | null>(null);
  const [travelMode, setTravelMode] = useState<TravelMode>("WHEELCHAIR");
  const [requirements, setRequirements] = useState<Record<string, boolean>>({
    avoidStairs: true,
  });
  const [save, setSave] = useState(true);
  const [picking, setPicking] = useState<PickKind | null>(null);
  const [awaitingMyLocation, setAwaitingMyLocation] = useState(false);
  const [roadPaths, setRoadPaths] = useState<LatLng[][]>([]);
  const [roadStatus, setRoadStatus] = useState<
    "idle" | "loading" | "ready" | "unavailable"
  >("idle");

  const [options, setOptions] = useState<IRouteOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [plan, setPlan] = useState<IPlanRouteResult | null>(null);
  const [plannedKey, setPlannedKey] = useState<string | null>(null);
  const [planning, setPlanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [radius, setRadius] = useState("1000");
  const [toolResult, setToolResult] = useState<string | null>(null);
  const [toolLoading, setToolLoading] = useState<string | null>(null);
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");

  const mapActions = useRef<IRouteMapActions | null>(null);
  const userLocation = useUserLocation();

  const selected = useMemo(
    () =>
      options.find((option) => option.id === selectedId) ?? options[0] ?? null,
    [options, selectedId],
  );
  const waypoints = useMemo(() => selected?.waypoints ?? [], [selected]);

  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.id === selected?.id),
  );
  const roadPath = roadPaths[selectedIndex] ?? roadPaths[0] ?? null;

  const currentKey = keyOf(origin, destination, travelMode, requirements);
  const stale =
    plannedKey !== null && currentKey !== null && plannedKey !== currentKey;

  /**
   * Street-level path for the map preview. The backend only returns scoring
   * waypoints, so the drawn line comes from the routing proxy; the corridor is
   * kept as the fallback when the provider is unreachable.
   */
  useEffect(() => {
    if (!origin || !destination) {
      setRoadPaths([]);
      setRoadStatus("idle");
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setRoadStatus("loading");

      const params = new URLSearchParams({
        originLat: String(origin.latitude),
        originLng: String(origin.longitude),
        destinationLat: String(destination.latitude),
        destinationLng: String(destination.longitude),
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

        const paths = response.ok && body?.success ? (body.paths ?? []) : [];
        setRoadPaths(paths.map((entry) => entry.coordinates));
        setRoadStatus(paths.length > 0 ? "ready" : "unavailable");
      } catch {
        if (!controller.signal.aborted) {
          setRoadPaths([]);
          setRoadStatus("unavailable");
        }
      }
    }, 350);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [origin, destination, travelMode]);

  // "My location" resolves asynchronously; fill the field when it arrives.
  useEffect(() => {
    if (!awaitingMyLocation || !userLocation.position) return;
    const point = {
      name: "My location",
      latitude: userLocation.position.latitude,
      longitude: userLocation.position.longitude,
    };
    setOrigin(point);
    mapActions.current?.focus(point);
    setAwaitingMyLocation(false);
  }, [awaitingMyLocation, userLocation.position]);

  const useMyLocation = () => {
    if (userLocation.position) {
      const point = {
        name: "My location",
        latitude: userLocation.position.latitude,
        longitude: userLocation.position.longitude,
      };
      setOrigin(point);
      mapActions.current?.focus(point);
      return;
    }
    setAwaitingMyLocation(true);
    userLocation.request();
  };

  const pickPoint = useCallback(
    (kind: PickKind, point: { latitude: number; longitude: number }) => {
      const existing = kind === "origin" ? origin : destination;
      // A map click is a fresh choice; a marker drag keeps the place name.
      const name =
        picking !== null
          ? kind === "origin"
            ? "Pinned start"
            : "Pinned destination"
          : (existing?.name ?? "Pinned place");

      const next: IRoutePoint = { name, ...point };
      if (kind === "origin") setOrigin(next);
      else setDestination(next);
      setPicking(null);
    },
    [origin, destination, picking],
  );

  const togglePick = (kind: PickKind) =>
    setPicking((current) => (current === kind ? null : kind));

  const swap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const findRoutes = async () => {
    if (!origin || !destination) {
      setError("Choose a starting point and a destination first.");
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
          name: destination.name,
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
        travelMode,
        accessibilityRequirements: requirements,
        save,
        name: `${origin.name} → ${destination.name}`,
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

      setPlan(data);
      setOptions(ranked);
      setSelectedId(ranked[0]?.id ?? null);
      setPlannedKey(keyOf(origin, destination, travelMode, requirements));

      if (ranked.length === 0) {
        setError("No route options were found between these places.");
      } else {
        toast.success(
          `Compared ${ranked.length} accessible route${ranked.length === 1 ? "" : "s"}`,
        );
      }
    } finally {
      setPlanning(false);
    }
  };

  const runTool = async (
    kind: "validate" | "score" | "barriers" | "accessibility",
  ) => {
    if (!origin || !destination) return;

    setToolLoading(kind);
    setToolResult(null);

    const endpoints = {
      origin: {
        name: origin.name,
        latitude: origin.latitude,
        longitude: origin.longitude,
      },
      destination: {
        name: destination.name,
        latitude: destination.latitude,
        longitude: destination.longitude,
      },
      travelMode,
    };

    try {
      if (kind === "validate") {
        const response = await validateRoute(endpoints);
        setToolResult(
          response.success && response.data
            ? `Valid route · ${(response.data.distanceMeters / 1000).toFixed(2)} km · ${Math.round(response.data.estimatedDurationSeconds / 60)} min`
            : response.message,
        );
      }

      if (kind === "score") {
        const response = await scoreRoute({
          origin: endpoints.origin,
          destination: endpoints.destination,
          radiusMeters: Number(radius) || 1000,
        });
        setToolResult(
          response.success && response.data
            ? `Area accessibility ${response.data.accessibilityScore}/100 (${response.data.rating ?? "unrated"}) · ${response.data.averageScore}% average nearby`
            : response.message,
        );
      }

      if (kind === "barriers") {
        if (!plan?.routeId) {
          setToolResult("Save the route first to inspect its corridors.");
          return;
        }
        const response = await getRouteBarriers(
          plan.routeId,
          Number(radius) || 500,
        );
        setToolResult(
          response.success
            ? `${response.data?.total ?? 0} active barrier report(s) along this corridor`
            : response.message,
        );
      }

      if (kind === "accessibility") {
        if (!plan?.routeId) {
          setToolResult("Save the route first to inspect its corridors.");
          return;
        }
        const response = await getRouteAccessibility(plan.routeId);
        setToolResult(
          response.success
            ? `Nearby accessibility average ${response.data?.averageScore ?? 0}/100 across ${response.data?.locations.length ?? 0} location(s)`
            : response.message,
        );
      }
    } finally {
      setToolLoading(null);
    }
  };

  const sendFeedback = async () => {
    if (!plan?.routeId) {
      toast.error("Save the route first to send feedback.");
      return;
    }

    const response = await submitRouteFeedback(plan.routeId, {
      rating: Number(rating),
      comment: comment || undefined,
    });

    if (response.success) {
      toast.success(response.message);
      setComment("");
    } else {
      toast.error(response.message);
    }
  };

  const canPlan = Boolean(origin && destination);

  return (
    <div className="flex min-w-0 flex-col gap-3 lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[23.5rem_minmax(0,1fr)] lg:grid-rows-[auto_minmax(0,1fr)]">
      {/* ── Planner form ───────────────────────────────────────────────── */}
      <Card className="min-w-0 shrink-0 lg:col-start-1 lg:row-start-1">
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <RouteEndpointPicker
              label="From"
              accent="origin"
              placeholder="Search a starting place"
              point={origin}
              onSelect={(point) => {
                setOrigin(point);
                setPicking(null);
                mapActions.current?.focus(point);
              }}
              onClear={() => setOrigin(null)}
              onUseMyLocation={useMyLocation}
              locating={
                awaitingMyLocation || userLocation.status === "requesting"
              }
              onTogglePick={() => togglePick("origin")}
              picking={picking === "origin"}
            />

            <div className="flex justify-center">
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={swap}
                disabled={!origin && !destination}
                aria-label="Swap start and destination"
                title="Swap start and destination"
              >
                <ArrowUpDown aria-hidden="true" />
              </Button>
            </div>

            <RouteEndpointPicker
              label="To"
              accent="destination"
              placeholder="Search a destination"
              point={destination}
              onSelect={(point) => {
                setDestination(point);
                setPicking(null);
                mapActions.current?.focus(point);
              }}
              onClear={() => setDestination(null)}
              onTogglePick={() => togglePick("destination")}
              picking={picking === "destination"}
            />
          </div>

          {userLocation.error && (
            <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <AlertTriangle
                aria-hidden="true"
                className="mt-0.5 size-3.5 shrink-0"
              />
              {userLocation.error}
            </p>
          )}

          <fieldset className="space-y-1.5">
            <legend className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Travel mode
            </legend>
            <div className="grid grid-cols-2 gap-1.5">
              {travelModes.map((mode) => {
                const Icon = mode.icon;
                const active = travelMode === mode.value;
                return (
                  <Button
                    key={mode.value}
                    type="button"
                    size="sm"
                    variant={active ? "secondary" : "outline"}
                    aria-pressed={active}
                    onClick={() => setTravelMode(mode.value)}
                    className={cn(
                      "justify-start gap-1.5",
                      active && "ring-1 ring-primary/40",
                    )}
                  >
                    <Icon aria-hidden="true" />
                    {mode.label}
                  </Button>
                );
              })}
            </div>
          </fieldset>

          <fieldset className="space-y-1.5">
            <legend className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              Needs
            </legend>
            <div className="flex flex-wrap gap-1.5">
              {requirementFields.map((field) => {
                const active = Boolean(requirements[field.key]);
                return (
                  <Button
                    key={field.key}
                    type="button"
                    variant={active ? "secondary" : "ghost"}
                    size="xs"
                    aria-pressed={active}
                    onClick={() =>
                      setRequirements((previous) => ({
                        ...previous,
                        [field.key]: !previous[field.key],
                      }))
                    }
                    className={cn(
                      "rounded-full border",
                      active ? "border-primary/40" : "border-border",
                    )}
                  >
                    {field.label}
                  </Button>
                );
              })}
            </div>
          </fieldset>

          {error && (
            <p
              role="alert"
              className="rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive"
            >
              {error}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 border-t border-border pt-3">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={save}
                onChange={(event) => setSave(event.target.checked)}
                className="size-3.5 rounded border accent-primary"
              />
              Save route
            </label>

            <Button
              type="button"
              size="sm"
              onClick={findRoutes}
              disabled={planning || !canPlan}
              title={
                canPlan ? undefined : "Choose a start and a destination first"
              }
            >
              {planning ? (
                <Loader2 aria-hidden="true" className="animate-spin" />
              ) : (
                <RouteIcon aria-hidden="true" />
              )}
              Find accessible routes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Map ────────────────────────────────────────────────────────── */}
      <div className="relative h-72 min-w-0 overflow-hidden rounded-xl border border-border bg-muted sm:h-80 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-auto">
        <RouteMap
          ref={mapActions}
          origin={origin}
          destination={destination}
          path={roadPath}
          waypoints={waypoints}
          picking={picking}
          userPosition={userLocation.position}
          onPick={pickPoint}
        />

        <div className="pointer-events-none absolute top-3 left-3 z-10 flex flex-col gap-1.5 text-xs">
          <span className="pointer-events-auto inline-flex items-center gap-1.5 rounded-lg border border-border bg-card/95 px-2 py-1 shadow-sm backdrop-blur">
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full bg-primary"
            />
            Start
            <span
              aria-hidden="true"
              className="ml-1 size-2.5 rounded-full bg-rose-600"
            />
            Destination
          </span>
          {!origin && !destination && (
            <span className="pointer-events-auto max-w-56 rounded-lg border border-border bg-card/95 px-2 py-1 text-muted-foreground shadow-sm backdrop-blur">
              Search a place above, or pin both points on the map.
            </span>
          )}
        </div>

        {picking && (
          <div className="absolute inset-x-3 top-3 z-20 flex items-center justify-between gap-2 rounded-lg border border-primary/40 bg-card px-3 py-2 text-xs shadow-md">
            <span>
              Click the map to set the{" "}
              <strong>{picking === "origin" ? "start" : "destination"}</strong>.
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={() => setPicking(null)}
              aria-label="Cancel picking on the map"
            >
              <X aria-hidden="true" />
            </Button>
          </div>
        )}

        {roadStatus === "unavailable" && origin && destination && (
          <span className="absolute bottom-3 left-3 z-10 rounded-lg border border-border bg-card/95 px-2 py-1 text-[11px] text-muted-foreground shadow-sm backdrop-blur">
            Street path unavailable — showing the scored corridor
          </span>
        )}

        {(origin || destination) && (
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={() => mapActions.current?.fitAll()}
            aria-label="Fit start and destination on the map"
            title="Fit on map"
            className="absolute top-3 right-3 z-10 bg-card shadow-sm"
          >
            <Maximize2 aria-hidden="true" />
          </Button>
        )}
      </div>

      {/* ── Results ────────────────────────────────────────────────────── */}
      <div className="relative min-w-0 space-y-2 lg:col-start-1 lg:row-start-2 lg:min-h-0 lg:overflow-y-auto lg:pr-0.5">
        {stale && (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-xs text-amber-700 dark:text-amber-400">
            Start, destination, mode or needs changed — run the comparison
            again.
          </p>
        )}

        {planning && (
          <Card>
            <CardContent className="flex items-center gap-2 py-1 text-sm text-muted-foreground">
              <Loader2
                aria-hidden="true"
                className="size-4 shrink-0 animate-spin"
              />
              Scoring accessibility and barriers along the corridor — long
              routes can take a few seconds.
            </CardContent>
          </Card>
        )}

        {!planning && options.length === 0 ? (
          <Card>
            <CardContent className="space-y-2 py-1">
              <p className="flex items-center gap-1.5 text-sm font-medium">
                <Info aria-hidden="true" className="size-4 text-primary" />
                No route planned yet
              </p>
              <ol className="list-decimal space-y-1 pl-4 text-xs text-muted-foreground">
                <li>Type a place name, or tap “My location” for the start.</li>
                <li>
                  Set where you are going the same way, or pin it on the map.
                </li>
                <li>
                  Pick a travel mode and your needs, then run the comparison.
                </li>
              </ol>
              <p className="text-xs text-muted-foreground">
                Every option is scored from verified accessibility data and live
                barrier reports along the corridor — not distance alone.
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="flex items-baseline justify-between gap-2 px-0.5">
              <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {options.length} route option
                {options.length === 1 ? "" : "s"}
              </h2>
              <span className="text-[11px] text-muted-foreground">
                {selected
                  ? `Showing ${selected.distanceText} · ${selected.durationText}`
                  : null}
              </span>
            </div>

            {options.map((option, index) => (
              <RouteOptionCard
                key={option.id}
                option={option}
                index={index}
                selected={option.id === selected?.id}
                onSelect={() => setSelectedId(option.id)}
              />
            ))}
          </>
        )}

        {plan?.routeId && options.length > 0 && (
          <details className="rounded-xl border border-border bg-card">
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground">
              Route tools · saved route
            </summary>
            <div className="space-y-2 border-t border-border p-3">
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled={toolLoading !== null}
                  onClick={() => runTool("barriers")}
                >
                  {toolLoading === "barriers" && (
                    <Loader2 aria-hidden="true" className="animate-spin" />
                  )}
                  Barriers
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled={toolLoading !== null}
                  onClick={() => runTool("accessibility")}
                >
                  {toolLoading === "accessibility" && (
                    <Loader2 aria-hidden="true" className="animate-spin" />
                  )}
                  Accessibility
                </Button>
                <Input
                  value={radius}
                  onChange={(event) => setRadius(event.target.value)}
                  type="number"
                  min={100}
                  aria-label="Corridor radius in meters"
                  className="h-6 w-24"
                />
              </div>

              {toolResult && (
                <output className="block rounded-md border border-border p-2 text-xs">
                  {toolResult}
                </output>
              )}

              <div className="grid gap-1.5 sm:grid-cols-[4rem_1fr_auto]">
                <Input
                  value={rating}
                  onChange={(event) => setRating(event.target.value)}
                  type="number"
                  min={1}
                  max={5}
                  aria-label="Route rating"
                  className="h-7"
                />
                <Input
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="How was this route?"
                  aria-label="Route feedback comment"
                  className="h-7"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  onClick={sendFeedback}
                >
                  Send
                </Button>
              </div>
            </div>
          </details>
        )}

        {canPlan && (
          <details className="rounded-xl border border-border bg-card">
            <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-muted-foreground">
              Diagnostics
            </summary>
            <div className="space-y-2 border-t border-border p-3">
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled={toolLoading !== null}
                  onClick={() => runTool("validate")}
                >
                  {toolLoading === "validate" && (
                    <Loader2 aria-hidden="true" className="animate-spin" />
                  )}
                  Validate route
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled={toolLoading !== null}
                  onClick={() => runTool("score")}
                >
                  {toolLoading === "score" && (
                    <Loader2 aria-hidden="true" className="animate-spin" />
                  )}
                  Area accessibility
                </Button>
              </div>
              {toolResult && (
                <output className="block rounded-md border border-border p-2 text-xs">
                  {toolResult}
                </output>
              )}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}
