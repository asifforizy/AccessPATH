import { ThumbsUp } from "lucide-react";

import { ActionButton } from "@/components/shared/action-button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { timeAgo } from "@/lib/format";
import {
  deleteFeedback,
  flagFeedback,
  getFeedback,
  markFeedbackHelpful,
} from "@/services/feedback";

import { FeedbackForm } from "./_components/feedback-form";
import { LocationFeedback } from "./_components/location-feedback";

export default async function FeedbackPage() {
  const feedback = await getFeedback({ limit: 50 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback"
        description="Read and share accessibility reviews for locations."
      />

      <FeedbackForm />

      <LocationFeedback />

      <Card>
        <CardHeader>
          <CardTitle>Recent feedback</CardTitle>
          <CardDescription>
            Vote helpful, flag inappropriate content, or remove your own review.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {feedback.data?.length ? (
            feedback.data.map((review) => (
              <div key={review.id} className="rounded-lg border p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">
                      {review.user?.name ?? "Anonymous"}
                    </span>
                    <Badge variant="warning">{review.rating}★</Badge>
                    <span className="text-xs text-muted-foreground">
                      {review.location?.name ?? "Unknown location"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(review.createdAt)}
                  </span>
                </div>

                {review.comment && (
                  <p className="mt-2 text-muted-foreground">{review.comment}</p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <ActionButton
                    action={markFeedbackHelpful.bind(null, review.id)}
                    label={`Helpful (${review._count?.helpfulVotes ?? 0})`}
                    size="xs"
                  />

                  <ActionButton
                    action={flagFeedback.bind(null, review.id)}
                    label="Flag"
                    variant="outline"
                    size="xs"
                    promptLabel="Reason for flagging this review"
                    promptPlaceholder="Spam, abuse, or misinformation"
                  />

                  <ActionButton
                    action={deleteFeedback.bind(null, review.id)}
                    label="Delete"
                    variant="destructive"
                    size="xs"
                    confirm="Delete this review?"
                  />

                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <ThumbsUp className="size-3" />
                    {review._count?.helpfulVotes ?? 0}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No feedback yet"
              description="Submit the first review for a location."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Every surface here is cookie-authenticated and dynamic; allow blocking render.
export const instant = false;
