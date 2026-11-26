"use client";

import { ArrowUpRight, Loader2, Navigation, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPlace } from "@/services/places.service";
import type { IUserPosition } from "@/types/map.types";
import type { IPlaceCard, IPlaceDetail } from "@/types/place.types";
import { accessibilityFeatureKeys } from "@/types/place.types";

import {
  CategoryIcon,
  FeatureState,
  formatDistance,
  VerificationBadge,
} from "./map-meta";

interface LocationPopupProps {
  place: IPlaceCard;
  distanceMeters?: number | null;
  userPosition: IUserPosition | null;
  onClose: () => void;
}

const directionsUrl = (place: IPlaceCard, origin: IUserPosition | null) => {
  const destination = `${place.latitude},${place.longitude}`;
  const from = origin ? `${origin.latitude},${origin.longitude};` : "";
  return `https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${from}${destination}`;
};

/**
 * Location details panel. Opens from a marker or a sidebar card and fetches the
 * full record (reviews, notes, photos) on demand.
 */
export function LocationPopup({
  place,
  distanceMeters,
  userPosition,
  onClose,
}: LocationPopupProps) {
  const [detail, setDetail] = useState<IPlaceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setDetail(null);

    getPlace(place.id, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return;
        if (!response.success || !response.data) {
          setError(response.message || "Details could not be loaded");
          return;
        }
        setDetail(response.data);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setError("Details could not be loaded");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [place.id]);

  const features =
    detail?.accessibility ?? (place.features as Record<string, boolean> | null);

  return (
    <section
      aria-label={`Details for ${place.name}`}
      className="absolute inset-x-3 bottom-3 z-20 max-h-[62%] overflow-y-auto rounded-xl border border-border bg-card p-4 shadow-lg sm:inset-x-auto sm:top-3 sm:right-3 sm:bottom-auto sm:w-[22rem] sm:max-h-[calc(100%-1.5rem)]"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">{place.name}</h2>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <CategoryIcon group={place.categoryGroup} />
            {place.category?.name ?? "Uncategorised"}
            {formatDistance(distanceMeters ?? null) && (
              <span>· {formatDistance(distanceMeters ?? null)} away</span>
            )}
          </p>
        </div>

        <Button
          ref={closeRef}
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close location details"
        >
          <X aria-hidden="true" />
        </Button>
      </div>

      <p className="mt-2 text-sm text-muted-foreground">
        {place.address}
        {place.city ? `, ${place.city}` : ""}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-1">
        <VerificationBadge status={place.verification} />
        {typeof place.accessibilityScore === "number" ? (
          <Badge variant="secondary">
            Score {place.accessibilityScore}/100
          </Badge>
        ) : (
          <Badge variant="outline">No accessibility score</Badge>
        )}
      </div>

      {place.features === null && (
        <p className="mt-2 rounded-md border border-border bg-muted/50 p-2 text-xs text-muted-foreground">
          Accessibility information has not been recorded for this place, so it
          is <strong>not confirmed accessible</strong>.
        </p>
      )}

      {loading ? (
        <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
          Loading accessibility details…
        </p>
      ) : error ? (
        <p role="alert" className="mt-3 text-xs text-destructive">
          {error}
        </p>
      ) : (
        <>
          <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
            {accessibilityFeatureKeys.map((feature) => (
              <FeatureState
                key={feature}
                feature={feature}
                features={
                  features as Partial<Record<typeof feature, boolean>> | null
                }
              />
            ))}
          </ul>

          {detail?.accessibility?.additionalInformation && (
            <p className="mt-2 text-xs text-muted-foreground">
              {detail.accessibility.additionalInformation}
            </p>
          )}

          {detail && detail.reviewCountTotal > 0 && (
            <p className="mt-2 text-xs text-muted-foreground">
              {detail.reviewCountTotal} community review
              {detail.reviewCountTotal === 1 ? "" : "s"}
              {typeof detail.averageRating === "number"
                ? ` · average ${detail.averageRating}/5`
                : ""}
            </p>
          )}
        </>
      )}

      <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
        <Button
          size="sm"
          variant="outline"
          nativeButton={false}
          render={<Link href={`/explore/${place.id}`} />}
        >
          <ArrowUpRight aria-hidden="true" className="size-3.5" />
          View details
        </Button>
        <a
          href={directionsUrl(place, userPosition)}
          target="_blank"
          rel="noreferrer"
          className={cn(buttonVariants({ size: "sm" }))}
        >
          <Navigation aria-hidden="true" className="size-3.5" />
          Get directions
        </a>
      </div>
    </section>
  );
}
