"use client";

import {
  CheckCircle2,
  ExternalLink,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { ImageUploadField } from "@/components/shared/image-upload-field";
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
import { uploadImage } from "@/services/uploads";

interface UploadPhotoPanelProps {
  /** Photo uploads are only for accounts with a verified email. */
  canUpload: boolean;
}

export function UploadPhotoPanel({ canUpload }: UploadPhotoPanelProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [place, setPlace] = useState<ISelectedPlace | null>(null);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [isPrimary, setIsPrimary] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<{
    url: string;
    placeName: string;
    placeId: string;
  } | null>(null);

  const reset = () => {
    setPhotoUrl(null);
    setPlace(null);
    setPlaceError(null);
    setIsPrimary(true);
    setSaved(null);
  };

  const save = async () => {
    if (!photoUrl) {
      toast.error("Choose a photo first");
      return;
    }
    if (!place) {
      setPlaceError("Choose the place this photo belongs to.");
      toast.error("Choose a place for this photo");
      return;
    }

    try {
      setSaving(true);
      // The local uploader returns a path; the API expects a full URL.
      const absoluteUrl = new URL(photoUrl, window.location.origin).toString();
      const res = await uploadImage({
        url: absoluteUrl,
        locationId: place.id,
        isPrimary,
      });

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(
        isPrimary
          ? `Saved as the main photo of ${place.name}`
          : `Photo added to ${place.name}`,
      );
      setSaved({ url: photoUrl, placeName: place.name, placeId: place.id });
      setPhotoUrl(null);
      setPlace(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setSaving(false);
    }
  };

  if (saved) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 aria-hidden="true" className="size-4 text-success" />
            Photo saved
          </CardTitle>
          <CardDescription>
            It is now attached to {saved.placeName}.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* biome-ignore lint/performance/noImgElement: uploaded photo preview */}
          <img
            src={saved.url}
            alt={saved.placeName}
            className="max-h-56 w-auto rounded-lg border border-border object-contain"
          />

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={reset}>
              <Upload className="size-4" />
              Upload another photo
            </Button>
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/explore/${saved.placeId}`} />}
            >
              <ExternalLink className="size-4" />
              View the place
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a photo</CardTitle>
        <CardDescription>
          Pick an image, tell us which place it shows, and it appears on that
          place for everyone.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canUpload && (
          <output className="block rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
            Photo uploads are available once your email address is verified. You
            can still browse and manage existing photos.
          </output>
        )}

        <div
          className={canUpload ? undefined : "pointer-events-none opacity-60"}
        >
          <ImageUploadField
            id="uploads-photo"
            label="1. Choose an image"
            value={photoUrl}
            onChange={setPhotoUrl}
          />
        </div>

        <div>
          <PlacePicker
            label="2. Which place is this photo for?"
            value={place}
            onChange={(next) => {
              setPlace(next);
              if (next) setPlaceError(null);
            }}
            error={placeError}
          />
        </div>

        <label
          htmlFor="uploads-primary"
          className="flex items-start gap-2 rounded-lg border border-border p-2.5 text-sm"
        >
          <input
            id="uploads-primary"
            type="checkbox"
            checked={isPrimary}
            onChange={(event) => setIsPrimary(event.target.checked)}
            className="mt-0.5 size-4 rounded border"
          />
          <span>
            <span className="font-medium">3. Show this as the main photo</span>
            <span className="block text-xs text-muted-foreground">
              Leave it off to add the photo to the gallery only.
            </span>
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            onClick={save}
            disabled={!canUpload || saving || !photoUrl}
          >
            {saving && <Loader2 aria-hidden="true" className="animate-spin" />}
            {saving ? "Saving…" : "Save photo"}
          </Button>
          {photoUrl && place && (
            <button
              type="button"
              onClick={() => setPhotoUrl(null)}
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Trash2 aria-hidden="true" className="size-3" />
              Remove the chosen file
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
