"use client";

import {
  Crosshair,
  Loader2,
  LocateFixed,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { UserLocationStatus } from "@/types/map.types";
import type { CategoryGroup } from "@/types/place.types";

import { categoryGroupLabel } from "./map-markers";
import { CategoryIcon } from "./map-meta";

const legendGroups: CategoryGroup[] = [
  "BUILDING",
  "PARK",
  "EDUCATION",
  "TRANSPORT",
  "GOVERNMENT",
  "COMMUNITY",
  "OTHER",
];

interface MapControlsProps {
  onLocate: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  userStatus: UserLocationStatus;
  userError: string | null;
  loading: boolean;
  error: string | null;
  resultCount: number;
  truncated: boolean;
  label: string;
  /** Slides the toolbar left so an open directions panel does not cover it. */
  shiftsWithPanel?: boolean;
}

export function MapControls({
  onLocate,
  onZoomIn,
  onZoomOut,
  onResetView,
  userStatus,
  userError,
  loading,
  error,
  resultCount,
  truncated,
  label,
  shiftsWithPanel = false,
}: MapControlsProps) {
  const locating = userStatus === "requesting";
  const hasLocation = userStatus === "granted";

  return (
    <>
      {/* Status / errors: announced to screen readers. */}
      <div
        aria-live="polite"
        className="pointer-events-none absolute top-3 left-3 z-10 flex max-w-[min(22rem,calc(100%-4.5rem))] flex-col gap-2"
      >
        <p className="pointer-events-auto inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-card/95 px-3 py-1.5 text-xs text-muted-foreground shadow-sm backdrop-blur">
          {loading && (
            <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
          )}
          <span>
            {loading
              ? `Loading ${label.toLowerCase()}…`
              : `${resultCount} ${label.toLowerCase()}`}
          </span>
          {truncated && (
            <span className="text-foreground">· zoom in for all</span>
          )}
        </p>

        {error && (
          <p
            role="alert"
            className="pointer-events-auto rounded-lg border border-border bg-card/95 px-3 py-1.5 text-xs text-destructive shadow-sm"
          >
            {error}
          </p>
        )}

        {userError && (
          <p
            role="alert"
            className="pointer-events-auto rounded-lg border border-border bg-card/95 px-3 py-1.5 text-xs text-foreground shadow-sm"
          >
            {userError}
          </p>
        )}
      </div>

      {/* Map tools */}
      <div
        className={cn(
          "absolute top-3 z-10 flex flex-col gap-1.5 transition-[right] duration-200",
          shiftsWithPanel ? "right-3 sm:right-[22.5rem]" : "right-3",
        )}
      >
        <Button
          type="button"
          size="icon"
          variant={hasLocation ? "default" : "outline"}
          onClick={onLocate}
          aria-label={
            hasLocation
              ? "Center map on my location"
              : "Use my current location"
          }
          title={hasLocation ? "Center on my location" : "Use my location"}
          className="bg-card shadow-sm"
        >
          {locating ? (
            <Loader2 aria-hidden="true" className="animate-spin" />
          ) : hasLocation ? (
            <LocateFixed aria-hidden="true" />
          ) : (
            <Crosshair aria-hidden="true" />
          )}
        </Button>

        <div className="flex flex-col overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onZoomIn}
            aria-label="Zoom in"
            className="rounded-none"
          >
            <ZoomIn aria-hidden="true" />
          </Button>
          <span className="h-px bg-border" />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={onZoomOut}
            aria-label="Zoom out"
            className="rounded-none"
          >
            <ZoomOut aria-hidden="true" />
          </Button>
        </div>

        <Button
          type="button"
          size="icon"
          variant="outline"
          onClick={onResetView}
          aria-label="Reset map view"
          title="Reset view"
          className="bg-card shadow-sm"
        >
          <RotateCcw aria-hidden="true" />
        </Button>
      </div>

      {/* Category legend: glyph + category name, never colour alone. */}
      <div className="absolute bottom-3 left-3 z-10 hidden max-w-[13rem] flex-col gap-1 rounded-lg border border-border bg-card/95 p-2 text-xs shadow-sm backdrop-blur sm:flex">
        <p className="font-semibold text-muted-foreground">Map legend</p>
        {legendGroups.map((group) => (
          <span
            key={group}
            className={cn("flex items-center gap-1.5 text-foreground")}
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <CategoryIcon group={group} className="size-3" />
            </span>
            {categoryGroupLabel[group]}
          </span>
        ))}
      </div>
    </>
  );
}
