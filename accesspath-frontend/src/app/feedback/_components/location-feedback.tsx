"use client";

import { Loader2, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getLocationFeedback, getLocationReviews } from "@/services/feedback";
import type { IReview } from "@/utils/types";

type Summary = {
  total: number;
  averageRating: number;
  distribution: Record<number, number>;
};

export function LocationFeedback() {
  const [locationId, setLocationId] = useState("");
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [reviews, setReviews] = useState<IReview[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      const [feedback, list] = await Promise.all([
        getLocationFeedback(locationId),
        getLocationReviews(locationId, { limit: 10 }),
      ]);

      if (!feedback.success) {
        toast.error(feedback.message);
        return;
      }

      setSummary(feedback.data);
      setReviews(list.data ?? []);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to load feedback",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border bg-card p-4">
      <div className="space-y-1.5">
        <Label htmlFor="lookup-location">Location feedback lookup</Label>
        <div className="flex gap-2">
          <Input
            id="lookup-location"
            value={locationId}
            onChange={(event) => setLocationId(event.target.value)}
            placeholder="Location UUID"
          />
          <Button
            type="button"
            disabled={loading || !locationId}
            onClick={load}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Search className="size-4" />
            )}
            Lookup
          </Button>
        </div>
      </div>

      {summary && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge variant="info">{summary.averageRating.toFixed(2)} / 5</Badge>
            <span className="text-muted-foreground">
              {summary.total} review(s)
            </span>
          </div>

          <div className="space-y-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary.distribution[star] ?? 0;
              const width = summary.total ? (count / summary.total) * 100 : 0;

              return (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-8">{star}★</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
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
                No reviews for this location.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
