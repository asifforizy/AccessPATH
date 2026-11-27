import { MapPin, Navigation, Star } from "lucide-react";
import Link from "next/link";

import { CategoryIcon, categoryGroupFromText } from "@/components/map/map-meta";
import { ActionButton } from "@/components/shared/action-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ActionResult, ILocationDetail } from "@/utils/types";

const groupGradient = {
  BUILDING: "from-sky-500/40 via-slate-600/30 to-slate-950",
  PARK: "from-emerald-500/40 via-teal-600/30 to-slate-950",
  EDUCATION: "from-indigo-500/40 via-blue-600/30 to-slate-950",
  TRANSPORT: "from-amber-500/40 via-orange-600/30 to-slate-950",
  GOVERNMENT: "from-violet-500/40 via-fuchsia-600/30 to-slate-950",
  COMMUNITY: "from-rose-500/40 via-pink-600/30 to-slate-950",
  OTHER: "from-primary/40 via-primary/25 to-slate-950",
} as const;

interface LocationHeroProps {
  location: ILocationDetail;
  photoUrl: string | null;
  favoriteAction: (value: string) => Promise<ActionResult>;
  isFavorite: boolean;
}

/**
 * Photo banner for a place. When there is no community photo we fall back to a
 * category-tinted gradient with the category glyph, so the page never shows an
 * empty grey box.
 */
export function LocationHero({
  location,
  photoUrl,
  favoriteAction,
  isFavorite,
}: LocationHeroProps) {
  const group = categoryGroupFromText(
    location.category?.name ?? "",
    location.category?.slug ?? "",
  );
  const rating =
    typeof location.averageRating === "number" ? location.averageRating : null;
  const photoCount = location.photos.length;

  return (
    <section className="overflow-hidden rounded-2xl ring-1 ring-foreground/10">
      <div className="relative isolate h-60 sm:h-76 lg:h-88">
        {/* Gradient underneath: also the fallback when the photo fails to load. */}
        <div
          aria-hidden="true"
          className={cn(
            "absolute inset-0 bg-gradient-to-br",
            groupGradient[group],
          )}
        />

        {photoUrl ? (
          // biome-ignore lint/performance/noImgElement: community-uploaded URLs are runtime values
          <img
            src={photoUrl}
            alt=""
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute -top-8 -right-8 text-white/15"
          >
            <CategoryIcon group={group} className="size-56" />
          </div>
        )}

        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/15"
        />

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5 sm:p-7">
          <nav
            aria-label="Breadcrumb"
            className="flex flex-wrap items-center gap-1.5 text-xs text-white/70"
          >
            <Link href="/explore" className="hover:text-white">
              Explore
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-white/90">
              {location.category?.name ?? "Uncategorised"}
            </span>
          </nav>

          <h1 className="text-2xl leading-tight font-bold tracking-tight text-white text-balance sm:text-3xl lg:text-4xl">
            {location.name}
          </h1>

          <p className="flex items-start gap-1.5 text-sm text-white/85">
            <MapPin aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            <span>
              {location.address}, {location.city}
              {location.postalCode ? ` ${location.postalCode}` : ""}
            </span>
          </p>

          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 text-xs">
            <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5 font-medium text-white backdrop-blur-sm">
              {location.accessibility?.isVerified
                ? "Verified accessibility"
                : location.accessibility
                  ? "Not verified"
                  : "Accessibility unknown"}
            </span>

            {rating !== null && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5 font-medium text-white backdrop-blur-sm">
                <Star aria-hidden="true" className="size-3 fill-current" />
                {rating.toFixed(1)}
                <span className="text-white/70">
                  ({location.reviewCount ?? location.reviews.length})
                </span>
              </span>
            )}

            {photoCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5 font-medium text-white backdrop-blur-sm">
                {photoCount} photo{photoCount === 1 ? "" : "s"}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-card p-3">
        <div className="flex flex-wrap items-center gap-2">
          <ActionButton
            action={favoriteAction}
            label={isFavorite ? "Saved to favorites" : "Save to favorites"}
            variant={isFavorite ? "secondary" : "outline"}
          />
          <Link
            href={`/routes?destinationId=${location.id}`}
            className={buttonVariants({ size: "sm" })}
          >
            <Navigation aria-hidden="true" className="size-3.5" />
            Get directions
          </Link>
          <Link
            href="/explore/map"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            View on map
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          {location._count?.favorites ?? 0} people saved this place
        </p>
      </div>
    </section>
  );
}
