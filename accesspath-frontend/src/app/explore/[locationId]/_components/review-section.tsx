import { MessageSquarePlus, Star } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { IReview } from "@/utils/types";

function StarRating({ rating }: { rating: number }) {
  return (
    <span
      role="img"
      aria-label={`${rating} out of 5 stars`}
      className="flex items-center gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          aria-hidden="true"
          className={cn(
            "size-3.5",
            star <= Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "text-muted-foreground/35",
          )}
        />
      ))}
    </span>
  );
}

interface ReviewSectionProps {
  reviews: IReview[];
  averageRating?: number | null;
  reviewCount?: number;
}

export function ReviewSection({
  reviews,
  averageRating,
  reviewCount,
}: ReviewSectionProps) {
  const total = reviewCount ?? reviews.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Community reviews</CardTitle>
        <CardDescription>
          {typeof averageRating === "number" && total > 0
            ? `${averageRating.toFixed(1)} average from ${total} review${total === 1 ? "" : "s"}.`
            : "No reviews yet — accessibility feedback is what makes this page useful."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {reviews.length === 0 ? (
          <EmptyState
            title="No reviews yet"
            description="Be the first to describe how accessible this place really is."
          />
        ) : (
          reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-xl border border-border bg-muted/30 p-3.5"
            >
              <header className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span
                    aria-hidden="true"
                    className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
                  >
                    {(review.user?.name ?? "Anonymous").charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {review.user?.name ?? "Anonymous"}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {timeAgo(review.createdAt)}
                    </p>
                  </div>
                </div>

                <StarRating rating={review.rating} />
              </header>

              {review.comment && (
                <p className="mt-2 text-sm text-foreground/90">
                  {review.comment}
                </p>
              )}
            </article>
          ))
        )}

        <Link
          href="/feedback"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "mt-1",
          )}
        >
          <MessageSquarePlus aria-hidden="true" className="size-3.5" />
          Share your experience
        </Link>
      </CardContent>
    </Card>
  );
}
