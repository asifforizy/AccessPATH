"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
import {
  getRoute,
  getRouteAccessibility,
  getRouteAlternatives,
  getRouteBarriers,
  getRoutePreferences,
  planRoute,
  scoreRoute,
  submitRouteFeedback,
  validateRoute,
} from "@/services/routes";

type Result = { label: string; value: unknown } | null;

const travelModes = ["WALKING", "WHEELCHAIR", "CYCLING", "DRIVING"];

export function RoutePlanner() {
  const [originName, setOriginName] = useState("");
  const [originLat, setOriginLat] = useState("40.7128");
  const [originLng, setOriginLng] = useState("-74.006");
  const [destName, setDestName] = useState("");
  const [destLat, setDestLat] = useState("40.7306");
  const [destLng, setDestLng] = useState("-73.9352");
  const [travelMode, setTravelMode] = useState("WALKING");
  const [save, setSave] = useState(false);

  const [routeId, setRouteId] = useState("");
  const [radius, setRadius] = useState("1000");

  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");

  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<Result>(null);

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
  });

  const run = async (
    key: string,
    label: string,
    action: () => Promise<{ success: boolean; message: string; data: unknown }>,
  ) => {
    try {
      setLoading(key);
      const res = await action();

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      setResult({ label, value: res.data });
      toast.success(res.message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Plan a route</CardTitle>
          <CardDescription>
            Coordinates are required by the API. Names are optional labels.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="originName">Origin name</Label>
              <Input
                id="originName"
                value={originName}
                onChange={(event) => setOriginName(event.target.value)}
                placeholder="Home"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="originLat">Origin latitude</Label>
              <Input
                id="originLat"
                type="number"
                step="any"
                value={originLat}
                onChange={(event) => setOriginLat(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="originLng">Origin longitude</Label>
              <Input
                id="originLng"
                type="number"
                step="any"
                value={originLng}
                onChange={(event) => setOriginLng(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="destName">Destination name</Label>
              <Input
                id="destName"
                value={destName}
                onChange={(event) => setDestName(event.target.value)}
                placeholder="Library"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="destLat">Destination latitude</Label>
              <Input
                id="destLat"
                type="number"
                step="any"
                value={destLat}
                onChange={(event) => setDestLat(event.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="destLng">Destination longitude</Label>
              <Input
                id="destLng"
                type="number"
                step="any"
                value={destLng}
                onChange={(event) => setDestLng(event.target.value)}
              />
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
                    {mode}
                  </option>
                ))}
              </Select>
            </div>

            <label className="flex items-end gap-2 pb-1 text-sm">
              <input
                type="checkbox"
                checked={save}
                onChange={(event) => setSave(event.target.checked)}
                className="size-4 rounded border"
              />
              Save this route
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={loading !== null}
              onClick={() =>
                run("plan", "Planned route", () =>
                  planRoute({ ...payload(), save }),
                )
              }
            >
              {loading === "plan" && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Plan route
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={loading !== null}
              onClick={() =>
                run("alternatives", "Alternatives", () =>
                  getRouteAlternatives({ ...payload(), count: 3 }),
                )
              }
            >
              {loading === "alternatives" && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Alternatives
            </Button>

            <Button
              type="button"
              variant="outline"
              disabled={loading !== null}
              onClick={() =>
                run("validate", "Validation", () => validateRoute(payload()))
              }
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
              onClick={() =>
                run("score", "Route score", () =>
                  scoreRoute({
                    origin: payload().origin,
                    destination: payload().destination,
                    radiusMeters: Number(radius) || 1000,
                  }),
                )
              }
            >
              {loading === "score" && (
                <Loader2 className="size-4 animate-spin" />
              )}
              Score route
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Saved route tools</CardTitle>
            <CardDescription>
              Look up a saved route, its barriers, and accessibility profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="routeId">Route ID</Label>
                <Input
                  id="routeId"
                  value={routeId}
                  onChange={(event) => setRouteId(event.target.value)}
                  placeholder="Route UUID"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="radius">Radius (meters)</Label>
                <Input
                  id="radius"
                  type="number"
                  value={radius}
                  onChange={(event) => setRadius(event.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={loading !== null || !routeId}
                onClick={() => run("route", "Route", () => getRoute(routeId))}
              >
                {loading === "route" && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Load route
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={loading !== null || !routeId}
                onClick={() =>
                  run("barriers", "Barriers", () =>
                    getRouteBarriers(routeId, Number(radius) || undefined),
                  )
                }
              >
                {loading === "barriers" && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Barriers
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={loading !== null || !routeId}
                onClick={() =>
                  run("accessibility", "Accessibility", () =>
                    getRouteAccessibility(routeId, Number(radius) || undefined),
                  )
                }
              >
                {loading === "accessibility" && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Accessibility
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={loading !== null}
                onClick={() =>
                  run("preferences", "Route preferences", () =>
                    getRoutePreferences(),
                  )
                }
              >
                Preferences
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Route feedback</CardTitle>
            <CardDescription>
              Rate a saved route after you travel it.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="rating">Rating</Label>
                <Select
                  id="rating"
                  value={rating}
                  onChange={(event) => setRating(event.target.value)}
                >
                  {[5, 4, 3, 2, 1].map((value) => (
                    <option key={value} value={value}>
                      {value} star{value === 1 ? "" : "s"}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="comment">Comment</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder="What worked well on this route?"
              />
            </div>

            <Button
              type="button"
              disabled={loading !== null || !routeId}
              onClick={async () => {
                try {
                  setLoading("feedback");
                  const res = await submitRouteFeedback(routeId, {
                    rating: Number(rating),
                    comment: comment || undefined,
                  });
                  if (!res.success) {
                    toast.error(res.message);
                    return;
                  }
                  toast.success(res.message);
                  setComment("");
                } finally {
                  setLoading(null);
                }
              }}
            >
              Submit feedback
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>{result?.label ?? "Result"}</CardTitle>
          <CardDescription>
            Raw API response for the last action you ran.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-4 text-xs">
            {result
              ? JSON.stringify(result.value, null, 2)
              : "Run an action to see its response."}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
