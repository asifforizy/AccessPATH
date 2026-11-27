"use client";

import { Star } from "lucide-react";
import { useMemo } from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IPlaceCard } from "@/types/place.types";
import { filterableFeatureKeys } from "@/types/place.types";
import {
  CategoryIcon,
  FeatureState,
  formatDistance,
  VerificationBadge,
} from "./map-meta";

interface LocationCardProps {
  place: IPlaceCard;
  distanceMeters?: number | null;
  selected: boolean;
  onSelect: (placeId: string) => void;
}

/**
 * Sidebar result card. It is a button so the whole list is keyboard operable —
 * this is the accessible equivalent of clicking a map marker.
 */
export function LocationCard({
  place,
  distanceMeters,
  selected,
  onSelect,
}: LocationCardProps) {
  const availableFeatures = useMemo(
    () =>
      place.features
        ? filterableFeatureKeys.filter((key) => place.features?.[key])
        : [],
    [place.features],
  );

  const distance = formatDistance(distanceMeters ?? null);

  return (
    <button
      type="button"
      onClick={() => onSelect(place.id)}
      aria-pressed={selected}
      aria-label={`${place.name}, ${place.category?.name ?? "uncategorised"}${
        distance ? `, ${distance} away` : ""
      }, ${place.reviewCount} ${
        place.reviewCount === 1 ? "review" : "reviews"
      }, ${place.verification === "verified" ? "verified" : place.verification === "unverified" ? "not verified" : "accessibility unknown"}`}
      className={cn(
        "w-full rounded-lg border border-border bg-card p-3 text-left transition-colors",
        "hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 outline-none",
        selected && "border-primary bg-muted ring-1 ring-primary/40",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{place.name}</p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <CategoryIcon group={place.categoryGroup} />
            <span className="truncate">
              {place.category?.name ?? "Uncategorised"}
              {distance ? ` · ${distance}` : ""}
            </span>
            <span className="shrink-0">
              · {place.reviewCount}{" "}
              {place.reviewCount === 1 ? "review" : "reviews"}
            </span>
          </p>
        </div>

        {typeof place.accessibilityScore === "number" ? (
          <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-semibold">
            <Star aria-hidden="true" className="size-3 text-muted-foreground" />
            {place.accessibilityScore}
            <span className="sr-only"> out of 100</span>
          </span>
        ) : (
          <span className="shrink-0 text-xs text-muted-foreground">
            No score
          </span>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        <VerificationBadge status={place.verification} />
        {availableFeatures.slice(0, 2).map((feature) => (
          <span key={feature}>
            <FeatureState feature={feature} features={place.features} compact />
          </span>
        ))}
        {availableFeatures.length > 2 && (
          <Badge variant="outline">+{availableFeatures.length - 2} more</Badge>
        )}
        {place.features === null && (
          <Badge variant="outline">No accessibility data</Badge>
        )}
      </div>
    </button>
  );
}
