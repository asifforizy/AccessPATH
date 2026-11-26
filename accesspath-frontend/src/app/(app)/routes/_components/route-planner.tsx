"use client";

import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Route as RouteIcon,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  getRouteAccessibility,
  getRouteBarriers,
  planRoute,
  scoreRoute,
  submitRouteFeedback,
  validateRoute,
} from "@/services/routes";
import type {
  IPlanRouteResult,
  IRouteOption,
  IRouteWarning,
} from "@/utils/types";

const travelModes = ["WALKING", "WHEELCHAIR", "CYCLING", "DRIVING"] as const;

const requirementFields = [
  { key: "avoidStairs", label: "Avoid stairs" },
  { key: "requireElevator", label: "Require elevator" },
  { key: "requireRestroom", label: "Accessible restroom nearby" },
  { key: "requireParking", label: "Accessible parking nearby" },
  { key: "avoidUnsafeCrossings", label: "Avoid unsafe crossings" },
] as const;

/** Small dependency-free route preview from real waypoints. */
function RoutePreview({
  waypoints,
  recommended,
}: {
  waypoints: Array<{ latitude: number; longitude: number }>;
  recommended: boolean;
}) {
  const geometry = useMemo(() => {
    if (waypoints.length < 2) return null;

    const lats = waypoints.map((point) => point.latitude);
    const lngs = waypoints.map((point) => point.longitude);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const spanLat = maxLat - minLat || 0.001;
    const spanLng = maxLng - minLng || 0.001;

    return waypoints.map((point) => ({
      x: 6 + ((point.longitude - minLng) / spanLng) * 88,
      y: 94 - ((point.latitude - minLat) / spanLat) * 88,
    }));
  }, [waypoints]);

  if (!geometry) return null;

  const first = geometry[0];
  const last = geometry[geometry.length - 1];

  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Route preview with ${waypoints.length} waypoints`}
      className="h-28 w-full rounded-md border border-border bg-muted/40"
    >
      <polyline
        points={geometry.map((point) => `${point.x},${point.y}`).join(" ")}
        fill="none"
        stroke="currentColor"
        strokeWidth={recommended ? 3 : 2}
        strokeDasharray={recommended ? undefined : "4 3"}
        className="text-primary"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {first && (
        <circle cx={first.x} cy={first.y} r={3.5} className="fill-primary" />
      )}
      {last && (
        <circle
          cx={last.x}
          cy={last.y}
          r={3.5}
          className="fill-background stroke-foreground"
          strokeWidth={2}
        />
      )}
    </svg>
  );
}

function WarningList({ warnings }: { warnings: IRouteWarning[] }) {
  if (warnings.length === 0) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CheckCircle2 aria-hidden="true" className="size-3.5" />
        No barriers reported along this corridor.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {warnings.slice(0, 6).map((warning) => (
        <li
          key={`${warning.code}-${warning.distanceMeters ?? 0}-${warning.locationId ?? ""}`}
          className="flex items-start gap-1.5 text-xs"
        >
          <AlertTriangle
            aria-hidden="true"
            className={
              warning.severity === "high"
                ? "mt-0.5 size-3.5 text-destructive"
                : "mt-0.5 size-3.5 text-muted-foreground"
            }
          />
          <span>
            {warning.message}
            {typeof warning.distanceMeters === "number" && (
              <span className="text-muted-foreground">
                {" "}
                · {warning.distanceMeters} m from route
              </span>
            )}
            <span className="sr-only"> ({warning.severity} severity)</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

function ScoreBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "positive" | "negative";
}) {
  if (value === 0) return null;
  const width = Math.min(
    100,
    Math.max(4, Math.abs(value) * (tone === "negative" ? 2.5 : 4)),
  );

  return (
    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
      <span className="w-32 shrink-0">{label}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <span
          className={
            tone === "positive"
              ? "block h-full rounded-full bg-primary"
              : "block h-full rounded-full bg-destructive/70"
          }
          style={{ width: `${width}%` }}
        />
      </span>
      <span className="w-10 shrink-0 text-right font-medium text-foreground">
        {tone === "positive" ? "+" : "−"}
        {value}
      </span>
    </div>
  );
}

export function RoutePlanner() {
  const [originName, setOriginName] = useState("Ramna Park");
  const [originLat, setOriginLat] = useState("23.7338");
  const [originLng, setOriginLng] = useState("90.4016");
  const [destName, setDestName] = useState("National Museum");
  const [destLat, setDestLat] = useState("23.7379");
  const [destLng, setDestLng] = useState("90.3945");
  const [travelMode, setTravelMode] = useState<string>("WHEELCHAIR");
  const [save, setSave] = useState(false);
  const [requirements, setRequirements] = useState<Record<string, boolean>>({
    avoidStairs: true,
  });

  const [options, setOptions] = useState<IRouteOption[]>([]);
  const [plan, setPlan] = useState<IPlanRouteResult | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const [routeId, setRouteId] = useState("");
  const [radius, setRadius] = useState("1000");
  const [toolResult, setToolResult] = useState<string | null>(null);
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");

  const payload = () => ({
    origin: {
      name: originName || undefined,
      latitude: Number(originLat),
      longitude: Number(originLng),
    },
    destination: {
      name: destName || undefined,
      latitude: Number(destLat),
      longitude: Number(destLng),
    },
    travelMode: travelMode as "WALKING" | "WHEELCHAIR" | "CYCLING" | "DRIVING",
    accessibilityRequirements: requirements,
    save,
  });

  const selected =
    options.find((option) => option.id === selectedId) ?? options[0] ?? null;

  const findRoutes = async () => {
    try {
      setLoading("alternatives");
      const response = await planRoute(payload());

      if (!response.success || !response.data) {
        toast.error(response.message);
        return;
      }

      setPlan(response.data);
      const asOptions: IRouteOption[] = response.data.alternatives.map(
        (summary) => ({
          ...summary,
          travelMode: response.data?.travelMode ?? travelMode,
        }),
      );

      setOptions(asOptions);
      setSelectedId(asOptions[0]?.id ?? null);

      if (response.data.routeId) {
        setRouteId(response.data.routeId);
        toast.success("Route planned and saved");
      } else {
        toast.success("Accessible routes ranked");
      }
    } finally {
      setLoading(null);
    }
  };

  const runTool = async (
    kind: "barriers" | "accessibility" | "validate" | "score",
  ) => {
    try {
      setLoading(kind);
      setToolResult(null);

      if (kind === "validate") {
        const response = await validateRoute(payload());
        setToolResult(
          response.success
            ? `Valid route · ${(response.data?.distanceMeters ?? 0) / 1000} km · ${Math.round((response.data?.estimatedDurationSeconds ?? 0) / 60)} min`
            : response.message,
        );
      }

      if (kind === "score") {
        const response = await scoreRoute({
          origin: payload().origin,
          destination: payload().destination,
          radiusMeters: Number(radius) || 1000,
        });
        setToolResult(
          response.success && response.data
            ? `Area accessibility score ${response.data.accessibilityScore} (${response.data.rating ?? "n/a"}) · ${response.data.averageScore}% average nearby`
            : response.message,
        );
      }

      if (kind === "barriers") {
        if (!routeId) {
          setToolResult("Plan and save a route first.");
          return;
        }
        const response = await getRouteBarriers(routeId, Number(radius) || 500);
        setToolResult(
          response.success
            ? `${response.data?.total ?? 0} active barrier report(s) along this route corridor`
            : response.message,
        );
      }

      if (kind === "accessibility") {
        if (!routeId) {
          setToolResult("Plan and save a route first.");
          return;
        }
        const response = await getRouteAccessibility(routeId);
        setToolResult(
          response.success
            ? `Nearby accessibility average ${response.data?.averageScore ?? 0}/100 across ${response.data?.locations.length ?? 0} location(s)`
            : response.message,
        );
      }
    } finally {
      setLoading(null);
    }
  };

  const sendFeedback = async () => {
    if (!routeId) {
      toast.error("Plan and save a route first.");
      return;
    }

    const response = await submitRouteFeedback(routeId, {
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

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Plan an accessible route</CardTitle>
          <CardDescription>
            Routes are scored from verified accessibility data and live barrier
            reports along each corridor — not distance alone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 rounded-lg border border-border p-3">
              <p className="text-sm font-medium">Origin</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={originName}
                  onChange={(event) => setOriginName(event.target.value)}
                  placeholder="Name"
                  aria-label="Origin name"
                  className="col-span-2 h-8"
                />
                <Input
                  value={originLat}
                  onChange={(event) => setOriginLat(event.target.value)}
                  type="number"
                  step="0.0001"
                  aria-label="Origin latitude"
                  className="h-8"
                />
                <Input
                  value={originLng}
                  onChange={(event) => setOriginLng(event.target.value)}
                  type="number"
                  step="0.0001"
                  aria-label="Origin longitude"
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-border p-3">
              <p className="text-sm font-medium">Destination</p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={destName}
                  onChange={(event) => setDestName(event.target.value)}
                  placeholder="Name"
                  aria-label="Destination name"
                  className="col-span-2 h-8"
                />
                <Input
                  value={destLat}
                  onChange={(event) => setDestLat(event.target.value)}
                  type="number"
                  step="0.0001"
                  aria-label="Destination latitude"
                  className="h-8"
                />
                <Input
                  value={destLng}
                  onChange={(event) => setDestLng(event.target.value)}
                  type="number"
                  step="0.0001"
                  aria-label="Destination longitude"
                  className="h-8"
                />
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="travelMode">Travel mode</Label>
              <Select
                id="travelMode"
                value={travelMode}
                onChange={(event) => setTravelMode(event.target.value)}
              >
                {travelModes.map((mode) => (
                  <option key={mode} value={mode}>
                    {mode.charAt(0)}
                    {mode.slice(1).toLowerCase()}
                  </option>
                ))}
              </Select>
            </div>

            <label className="flex items-end gap-2 pb-1 text-sm">
              <input
                type="checkbox"
                checked={save}
                onChange={(event) => setSave(event.target.checked)}
                className="size-4 rounded border accent-primary"
              />
              Save this route
            </label>
          </div>

          <fieldset>
            <legend className="mb-2 text-sm font-medium">
              Accessibility requirements
            </legend>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {requirementFields.map((field) => (
                <label
                  key={field.key}
                  className="flex cursor-pointer items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={Boolean(requirements[field.key])}
                    onChange={(event) =>
                      setRequirements((previous) => ({
                        ...previous,
                        [field.key]: event.target.checked,
                      }))
                    }
                    className="size-4 accent-primary"
                  />
                  {field.label}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={findRoutes}
              disabled={loading !== null}
            >
              {loading === "alternatives" ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <RouteIcon className="size-4" />
              )}
              Find accessible routes
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading !== null}
              onClick={() => runTool("validate")}
            >
              {loading === "validate" && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Validate
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading !== null}
              onClick={() => runTool("score")}
            >
              {loading === "score" && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Area score
            </Button>
          </div>
        </CardContent>
      </Card>

      {options.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Ranked route options</CardTitle>
            <CardDescription>
              Ranked by accessibility score first, then travel time.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {options.map((option, index) => (
              <button
                type="button"
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                aria-pressed={option.id === selected?.id}
                className={`w-full rounded-lg border p-3 text-left transition-colors ${
                  option.id === selected?.id
                    ? "border-primary bg-muted"
                    : "border-border hover:bg-muted"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Badge variant={option.recommended ? "success" : "outline"}>
                      {option.recommended
                        ? "Recommended"
                        : `Option ${index + 1}`}
                    </Badge>
                    <span className="text-sm font-medium">
                      {option.distanceText} · {option.durationText}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    <Badge variant="secondary">
                      Score {option.accessibilityScore}/100
                    </Badge>
                    <Badge variant="outline">Grade {option.grade}</Badge>
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {option.support.sampledLocations} accessible place(s) along
                  the corridor · {option.support.verifiedRatio}% verified
                  {option.support.stepFreeRatio > 0
                    ? ` · ${option.support.stepFreeRatio}% step-free`
                    : ""}
                </p>
              </button>
            ))}

            {selected && (
              <div className="grid gap-4 border-t border-border pt-3 md:grid-cols-2">
                <div className="space-y-3">
                  <RoutePreview
                    waypoints={selected.waypoints}
                    recommended={selected.recommended}
                  />
                  <div className="space-y-1.5">
                    <ScoreBar
                      label="Verified data bonus"
                      value={selected.breakdown.supportBonus}
                      tone="positive"
                    />
                    {selected.breakdown.modeBonus > 0 && (
                      <ScoreBar
                        label="Step-free bonus"
                        value={selected.breakdown.modeBonus}
                        tone="positive"
                      />
                    )}
                    <ScoreBar
                      label="Barrier penalty"
                      value={selected.breakdown.barrierPenalty}
                      tone="negative"
                    />
                    <ScoreBar
                      label="Detour penalty"
                      value={selected.breakdown.distancePenalty}
                      tone="negative"
                    />
                    <ScoreBar
                      label="Unverified data"
                      value={selected.breakdown.dataQualityPenalty}
                      tone="negative"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Accessibility warnings</p>
                  <WarningList warnings={selected.warnings} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {plan?.routeId && (
        <Card>
          <CardHeader>
            <CardTitle>Route tools</CardTitle>
            <CardDescription>
              Saved route ID: <code className="text-xs">{plan.routeId}</code>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-3">
              <Input
                value={radius}
                onChange={(event) => setRadius(event.target.value)}
                type="number"
                aria-label="Radius in meters"
                placeholder="Radius (m)"
                className="h-8"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => runTool("barriers")}
                disabled={loading !== null}
              >
                Barriers along route
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => runTool("accessibility")}
                disabled={loading !== null}
              >
                Accessibility profile
              </Button>
            </div>

            {toolResult && (
              <output className="block rounded-md border border-border p-2 text-xs">
                {toolResult}
              </output>
            )}

            <div className="grid gap-2 sm:grid-cols-[6rem_1fr_auto]">
              <Input
                value={rating}
                onChange={(event) => setRating(event.target.value)}
                type="number"
                min={1}
                max={5}
                aria-label="Route rating"
                className="h-8"
              />
              <Input
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="Optional comment about this route"
                aria-label="Route feedback comment"
                className="h-8"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={sendFeedback}
              >
                Send feedback
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
