"use client";

import { ImageOff, Loader2, Star, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  type ISelectedPlace,
  PlacePicker,
} from "@/components/shared/place-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getPlace } from "@/services/places.service";
import { deleteMedia } from "@/services/uploads";

type Photo = { id: string; url: string; isPrimary?: boolean };

/**
 * Photos of one place, chosen by name — no media UUID to look up.
 */
export function PlacePhotos() {
  const [place, setPlace] = useState<ISelectedPlace | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!place) {
      setPhotos([]);
      setError(null);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    getPlace(place.id, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return;
        if (!response.success || !response.data) {
          setPhotos([]);
          setError(response.message || "Photos could not be loaded");
          return;
        }
        setPhotos(response.data.photos ?? []);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setPhotos([]);
        setError("Photos could not be loaded");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [place]);

  const remove = async (photo: Photo) => {
    try {
      setDeleting(photo.id);
      const res = await deleteMedia(photo.id);

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success("Photo removed");
      setPhotos((current) => current.filter((item) => item.id !== photo.id));
    } catch (error_) {
      toast.error(
        error_ instanceof Error ? error_.message : "Could not remove the photo",
      );
    } finally {
      setDeleting(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Photos of a place</CardTitle>
        <CardDescription>
          Search a place by name to see its photos and remove any that are
          wrong.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <PlacePicker label="Find a place" value={place} onChange={setPlace} />

        {loading && (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
            Loading photos…
          </p>
        )}

        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}

        {!place && !loading && (
          <p className="text-xs text-muted-foreground">
            Nothing selected yet — search for a place above.
          </p>
        )}

        {place && !loading && !error && photos.length === 0 && (
          <p className="flex items-center gap-2 rounded-lg border border-dashed px-3 py-6 text-sm text-muted-foreground">
            <ImageOff aria-hidden="true" className="size-4" />
            {place.name} has no photos yet.
          </p>
        )}

        {photos.length > 0 && (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {photos.map((photo) => (
              <li
                key={photo.id}
                className="overflow-hidden rounded-lg border border-border"
              >
                {/* biome-ignore lint/performance/noImgElement: uploaded photo */}
                <img
                  src={photo.url}
                  alt={place?.name ?? "The place"}
                  className="aspect-4/3 w-full object-cover"
                />
                <div className="flex items-center justify-between gap-2 p-2">
                  {photo.isPrimary ? (
                    <Badge variant="success" className="gap-1">
                      <Star aria-hidden="true" className="size-3" />
                      Main photo
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Gallery
                    </span>
                  )}

                  <Button
                    type="button"
                    variant="destructive"
                    size="xs"
                    disabled={deleting !== null}
                    onClick={() => remove(photo)}
                  >
                    {deleting === photo.id ? (
                      <Loader2 aria-hidden="true" className="animate-spin" />
                    ) : (
                      <Trash2 aria-hidden="true" />
                    )}
                    Remove
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
