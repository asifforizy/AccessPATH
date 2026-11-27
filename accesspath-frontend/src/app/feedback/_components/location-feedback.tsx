"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  type ISelectedPlace,
  PlacePicker,
} from "@/components/shared/place-picker";
import { Badge } from "@/components/ui/badge";
import { getLocationFeedback, getLocationReviews } from "@/services/feedback";
import type { IReview } from "@/utils/types";

type Summary = {
  total: number;
  averageRating: number;
  distribution: Record<number, number>;
};

/**
 * Ratings for one place, chosen by name — no UUID to look up.
 */
export function LocationFeedback() {
  const [place, setPlace] = useState<ISelectedPlace | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [reviews, setReviews] = useState<IReview[]>([]);

  useEffect(() => {
    if (!place) {
      setSummary(null);
      setReviews([]);
      return;
    }

    const controller = { cancelled: false };
    setLoading(true);

    Promise.all([
      getLocationFeedback(place.id),
      getLocationReviews(place.id, { limit: 10 }),
    ])
      .then(([feedback, list]) => {
        if (controller.cancelled) return;
        if (!feedback.success) {
          setSummary(null);
          setReviews([]);
          toast.error(feedback.message);
          return;
        }
        setSummary(feedback.data);
        setReviews(list.data ?? []);
      })
      .catch(() => {
        if (controller.cancelled) return;
        setSummary(null);
        setReviews([]);
        toast.error("Failed to load feedback");
      })
      .finally(() => {
        if (!controller.cancelled) setLoading(false);
      });

    return () => {
      controller.cancelled = true;
    };
  }, [place]);

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <PlacePicker
        label="Location feedback lookup"
        value={place}
        onChange={setPlace}
      />

      {loading && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
          Loading ratings…
        </p>
      )}

      {!place && !loading && (
        <p className="text-xs text-muted-foreground">
          Search a place by name to see how visitors rated its accessibility.
        </p>
      )}

      {summary && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="font-medium">{place?.name}</span>
            <Badge variant="info">{summary.averageRating.toFixed(2)} / 5</Badge>
            <span className="text-muted-foreground">
              {summary.total} review{summary.total === 1 ? "" : "s"}
            </span>
          </div>

          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.distribution[star] ?? 0;
              const width = summary.total ? (count / summary.total) * 100 : 0;

              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-8">{star}★</span>
                  <div
                    className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
                    role="img"
                    aria-label={`${star} star: ${count} of ${summary.total}`}
                  >
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-muted-foreground">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            {reviews.length ? (
              reviews.map((review) => (
                <div key={review.id} className="rounded-md border p-2 text-xs">
                  <p className="font-medium">
                    {review.user?.name ?? "Anonymous"} · {review.rating}★
                  </p>
                  {review.comment && (
                    <p className="mt-1 text-muted-foreground">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">
                No reviews for this place yet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
