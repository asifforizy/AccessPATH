"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  deleteMedia,
  getMedia,
  getPresignedUrl,
  uploadImage,
  uploadImages,
} from "@/services/uploads";

const modes = ["single", "multiple", "presigned"] as const;

export function UploadForm() {
  const router = useRouter();

  const [mode, setMode] = useState<(typeof modes)[number]>("single");
  const [url, setUrl] = useState("");
  const [publicId, setPublicId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [reportId, setReportId] = useState("");
  const [isPrimary, setIsPrimary] = useState(false);
  const [itemsJson, setItemsJson] = useState(
    '[\n  { "url": "https://example.com/photo.jpg", "locationId": "uuid" }\n]',
  );
  const [fileName, setFileName] = useState("");
  const [contentType, setContentType] = useState("image/jpeg");
  const [folder, setFolder] = useState("");

  const [mediaId, setMediaId] = useState("");
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const submit = async () => {
    try {
      setLoading("submit");

      if (mode === "single") {
        const res = await uploadImage({
          url,
          publicId: publicId || undefined,
          locationId: locationId || undefined,
          reportId: reportId || undefined,
          isPrimary,
        });

        if (!res.success) {
          toast.error(res.message);
          return;
        }

        setResult(res.data);
        toast.success("Image registered");
      } else if (mode === "multiple") {
        let items: unknown;

        try {
          items = JSON.parse(itemsJson);
        } catch {
          toast.error("Items must be valid JSON");
          return;
        }

        const res = await uploadImages(items as never);

        if (!res.success) {
          toast.error(res.message);
          return;
        }

        setResult(res.data);
        toast.success("Images registered");
      } else {
        const res = await getPresignedUrl({
          fileName,
          contentType,
          folder: folder || undefined,
        });

        if (!res.success) {
          toast.error(res.message);
          return;
        }

        setResult(res.data);
        toast.success("Presigned URL generated");
      }

      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setLoading(null);
    }
  };

  const loadMedia = async () => {
    try {
      setLoading("media");
      const res = await getMedia(mediaId);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      setResult(res.data);
    } finally {
      setLoading(null);
    }
  };

  const removeMedia = async () => {
    if (!window.confirm("Delete this media record?")) return;

    try {
      setLoading("delete");
      const res = await deleteMedia(mediaId);
      if (!res.success) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      setMediaId("");
      setResult(null);
      router.refresh();
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Register media</CardTitle>
          <CardDescription>
            The backend stores media metadata and links it to a location or
            report.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="mode">Mode</Label>
            <Select
              id="mode"
              value={mode}
              onChange={(event) =>
                setMode(event.target.value as (typeof modes)[number])
              }
            >
              {modes.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </Select>
          </div>

          {mode === "single" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="url">Image URL</Label>
                <Input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="publicId">Public ID</Label>
                  <Input
                    id="publicId"
                    value={publicId}
                    onChange={(event) => setPublicId(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="locationId">Location ID</Label>
                  <Input
                    id="locationId"
                    value={locationId}
                    onChange={(event) => setLocationId(event.target.value)}
                    placeholder="UUID"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reportId">Report ID</Label>
                  <Input
                    id="reportId"
                    value={reportId}
                    onChange={(event) => setReportId(event.target.value)}
                    placeholder="UUID"
                  />
                </div>
                <label className="flex items-end gap-2 pb-1 text-sm">
                  <input
                    type="checkbox"
                    checked={isPrimary}
                    onChange={(event) => setIsPrimary(event.target.checked)}
                    className="size-4 rounded border"
                  />
                  Primary photo
                </label>
              </div>

              <p className="text-xs text-muted-foreground">
                Provide exactly one of location ID or report ID.
              </p>
            </>
          )}

          {mode === "multiple" && (
            <div className="space-y-1.5">
              <Label htmlFor="items">Items (JSON array)</Label>
              <Textarea
                id="items"
                value={itemsJson}
                onChange={(event) => setItemsJson(event.target.value)}
                className="min-h-48 font-mono text-xs"
              />
            </div>
          )}

          {mode === "presigned" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="fileName">File name</Label>
                <Input
                  id="fileName"
                  value={fileName}
                  onChange={(event) => setFileName(event.target.value)}
                  placeholder="photo.jpg"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="contentType">Content type</Label>
                  <Input
                    id="contentType"
                    value={contentType}
                    onChange={(event) => setContentType(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="folder">Folder</Label>
                  <Input
                    id="folder"
                    value={folder}
                    onChange={(event) => setFolder(event.target.value)}
                    placeholder="locations"
                  />
                </div>
              </div>
            </>
          )}

          <Button type="button" disabled={loading !== null} onClick={submit}>
            {loading === "submit" && (
              <Loader2 className="size-4 animate-spin" />
            )}
            Submit
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Media lookup</CardTitle>
            <CardDescription>
              Fetch or delete a media record by ID.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="mediaId">Media ID</Label>
              <Input
                id="mediaId"
                value={mediaId}
                onChange={(event) => setMediaId(event.target.value)}
                placeholder="Media UUID"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={loading !== null || !mediaId}
                onClick={loadMedia}
              >
                {loading === "media" && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Load
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={loading !== null || !mediaId}
                onClick={removeMedia}
              >
                {loading === "delete" && (
                  <Loader2 className="size-4 animate-spin" />
                )}
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Result</CardTitle>
            <CardDescription>
              Raw response from the last action.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-80 overflow-auto rounded-lg bg-muted p-4 text-xs">
              {result
                ? JSON.stringify(result, null, 2)
                : "No media action yet."}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
