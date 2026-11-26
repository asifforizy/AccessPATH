"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { LocationPicker } from "@/components/map/location-picker";
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
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  barrierLabels,
  barrierTypes,
  otherReportTypes,
} from "@/lib/report-types";
import { createReport } from "@/services/reports";

export function ReportForm() {
  const router = useRouter();

  const [place, setPlace] = useState<ISelectedPlace | null>(null);
  const [type, setType] = useState<string>(barrierTypes[0]);
  const [description, setDescription] = useState("");
  const [coordinates, setCoordinates] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);

  const onSelectPlace = (next: ISelectedPlace | null) => {
    setPlace(next);
    setPlaceError(null);
    if (next) {
      setCoordinates({ latitude: next.latitude, longitude: next.longitude });
    }
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!place) {
      setPlaceError("Choose the location the barrier belongs to.");
      return;
    }

    if (!coordinates) {
      toast.error("Set the barrier position on the map.");
      return;
    }

    try {
      setLoading(true);

      const res = await createReport({
        locationId: place.id,
        type,
        description,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        attachments: attachmentUrl ? [{ url: attachmentUrl }] : undefined,
      });

      if (!res.success) {
        toast.error(res.message);
        return;
      }

      toast.success(res.message);
      setDescription("");
      setAttachmentUrl(null);
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create report",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Report an accessibility barrier</CardTitle>
        <CardDescription>
          Barrier reports are reviewed by moderators before they affect route
          scores.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <PlacePicker
              value={place}
              onChange={onSelectPlace}
              error={placeError}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="type">Barrier category</Label>
            <Select
              id="type"
              value={type}
              onChange={(event) => setType(event.target.value)}
            >
              <optgroup label="Accessibility barriers">
                {barrierTypes.map((item) => (
                  <option key={item} value={item}>
                    {barrierLabels[item]}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Other reports">
                {otherReportTypes.map((item) => (
                  <option key={item} value={item}>
                    {barrierLabels[item]}
                  </option>
                ))}
              </optgroup>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Describe what blocks access (at least 10 characters)"
              minLength={10}
              required
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label>Barrier location (GPS)</Label>
            <LocationPicker
              latitude={coordinates?.latitude ?? place?.latitude ?? null}
              longitude={coordinates?.longitude ?? place?.longitude ?? null}
              onChange={setCoordinates}
            />
          </div>

          <div className="md:col-span-2">
            <ImageUploadField
              id="report-photo"
              label="Photo evidence (optional)"
              value={attachmentUrl}
              onChange={setAttachmentUrl}
            />
          </div>

          <div className="md:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="size-4 animate-spin" />}
              Submit barrier report
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
