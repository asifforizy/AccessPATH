import { ImagePlus } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { IPhoto } from "@/utils/types";

interface PhotoGalleryProps {
  photos: IPhoto[];
  name: string;
}

/** Community photo grid. The first photo spans the full width on wide screens. */
export function PhotoGallery({ photos, name }: PhotoGalleryProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {photos.map((photo, index) => (
        <a
          key={photo.id}
          href={photo.url}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "group relative block overflow-hidden rounded-xl ring-1 ring-foreground/10",
            index === 0 && "sm:col-span-2",
          )}
        >
          {/* biome-ignore lint/performance/noImgElement: community-uploaded URLs are runtime values */}
          <img
            src={photo.url}
            alt={`${name}, view ${index + 1}`}
            loading={index === 0 ? "eager" : "lazy"}
            className={cn(
              "w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]",
              index === 0 ? "aspect-16/9" : "aspect-4/3",
            )}
          />
          {photo.isPrimary && (
            <span className="absolute top-2 left-2 rounded bg-black/65 px-1.5 py-0.5 text-[10px] font-medium text-white">
              Primary photo
            </span>
          )}
        </a>
      ))}
    </div>
  );
}

/** Shown when nobody has uploaded a photo yet. */
export function NoPhotosYet() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
      <ImagePlus aria-hidden="true" className="size-7 text-muted-foreground" />
      <p className="text-sm font-medium">No photos yet</p>
      <p className="max-w-sm text-xs text-muted-foreground">
        A photo of the entrance or the accessible route helps other people far
        more than a description does.
      </p>
      <Link
        href="/uploads"
        className={buttonVariants({ variant: "outline", size: "sm" })}
      >
        Upload a photo
      </Link>
    </div>
  );
}
