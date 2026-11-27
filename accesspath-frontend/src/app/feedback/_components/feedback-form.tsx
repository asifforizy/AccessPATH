"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  type ISelectedPlace,
  PlacePicker,
} from "@/components/shared/place-picker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createFeedback } from "@/services/feedback";

export function FeedbackForm() {
  const router = useRouter();

  const [place, setPlace] = useState<ISelectedPlace | null>(null);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!place) {
      setPlaceError("Choose the place you visited first.");
      toast.error("Choose a place to review");
      return;
    }

    try {
      setLoading(true);
      const res = await createFeedback({
        locationId: place.id,
        rating: Number(rating),
        comment: comment || undefined,
      });

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message);
      setPlace(null);
      setPlaceError(null);
      setComment("");
      setRating("5");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to submit feedback",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share feedback</CardTitle>
        <CardDescription>
          Search for the place by name, then rate its accessibility to help
          other visitors.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <PlacePicker
              label="Which place did you visit?"
              value={place}
              onChange={(next) => {
                setPlace(next);
                if (next) setPlaceError(null);
              }}
              error={placeError}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="feedback-rating">Rating</Label>
            <Select
              id="feedback-rating"
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

          <div className="space-y-1.5 md:col-span-2">
            <Label htmlFor="feedback-comment">Comment</Label>
            <Textarea
              id="feedback-comment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Describe your experience"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 md:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Submit feedback
            </Button>
            <p className="text-xs text-muted-foreground">
              {place
                ? `Reviewing ${place.name}`
                : "Pick a place above to enable submitting."}
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
