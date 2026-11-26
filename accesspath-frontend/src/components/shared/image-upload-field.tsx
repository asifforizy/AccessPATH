"use client";

import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { uploadImage } from "@/lib/upload-client";

interface ImageUploadFieldProps {
  id: string;
  label?: string;
  value: string | null;
  onChange: (url: string | null) => void;
  helpText?: string;
}

/**
 * Real file upload (not a pasted URL): posts to /api/uploads and reports back
 * the stored URL. Keeps a text fallback for externally hosted images.
 */
export function ImageUploadField({
  id,
  label = "Photo",
  value,
  onChange,
  helpText = "JPEG, PNG, WebP or GIF up to 8 MB.",
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");

  const handleFile = async (file: File | undefined) => {
    if (!file) return;

    setUploading(true);
    setError(null);

    const result = await uploadImage(file);

    setUploading(false);
    if (!result.success || !result.url) {
      setError(result.message);
      return;
    }

    onChange(result.url);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-1.5">
      <span className="text-sm font-medium">{label}</span>

      {value ? (
        <div className="flex items-center gap-2 rounded-lg border border-border p-2">
          {/* biome-ignore lint/performance/noImgElement: user-uploaded preview */}
          <img
            src={value}
            alt="Uploaded preview"
            className="size-12 rounded-md object-cover"
          />
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {value}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Remove image"
            onClick={() => onChange(null)}
          >
            <Trash2 aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground hover:bg-muted"
        >
          {uploading ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <ImagePlus aria-hidden="true" className="size-4" />
          )}
          {uploading ? "Uploading…" : "Choose an image"}
          <input
            ref={inputRef}
            id={id}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="sr-only"
            disabled={uploading}
            onChange={(event) => handleFile(event.target.files?.[0])}
          />
        </label>
      )}

      <p className="text-xs text-muted-foreground">{helpText}</p>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      {!value && (
        <div className="flex gap-2">
          <Input
            value={manualUrl}
            placeholder="…or paste an image URL"
            aria-label="Image URL"
            onChange={(event) => setManualUrl(event.target.value)}
            className="h-8"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!/^https?:\/\//.test(manualUrl)}
            onClick={() => {
              onChange(manualUrl);
              setManualUrl("");
            }}
          >
            Use URL
          </Button>
        </div>
      )}
    </div>
  );
}
