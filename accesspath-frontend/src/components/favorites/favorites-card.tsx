import { Accessibility, MapPin } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { ActionButton } from "@/components/shared/action-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { timeAgo } from "@/lib/format";
import { type getFavorites, removeFavorite } from "@/services/favorites";

type Favorite = NonNullable<
  Awaited<ReturnType<typeof getFavorites>>["data"]
>[number];

const MAX_CHIPS = 3;

export function FavoriteCard({ favorite }: { favorite: Favorite }) {
  const location = favorite.location;
  const accessibility = location?.accessibility;
  const photo = location?.photos?.[0]?.url;

  // Adjust the href to your location details route.
  const href = location?.id ? `/explore/${location.id}` : "/explore";

  const features = [
    accessibility?.wheelchairAccessible && {
      label: "Wheelchair",
      variant: "success" as const,
    },
    accessibility?.stepFreeEntrance && {
      label: "Step-free",
      variant: "info" as const,
    },
    accessibility?.rampAvailable && {
      label: "Ramp",
      variant: "info" as const,
    },
    accessibility?.elevatorAvailable && {
      label: "Elevator",
      variant: "info" as const,
    },
    accessibility?.accessibleRestroom && {
      label: "Restroom",
      variant: "info" as const,
    },
  ].filter(Boolean) as { label: string; variant: "success" | "info" }[];

  const visible = features.slice(0, MAX_CHIPS);
  const extra = features.length - visible.length;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-card transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link href={href} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {photo ? (
            <Image
              src={photo}
              alt={location?.name ?? "Saved location"}
              fill
              unoptimized
              sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-gradient-to-br from-primary/15 via-primary/5 to-muted">
              <MapPin className="size-8 text-primary/50" />
            </div>
          )}

          {location?.category && (
            <Badge
              variant="secondary"
              className="absolute left-3 top-3 bg-background/90 backdrop-blur"
            >
              {location.category.name}
            </Badge>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="min-w-0 space-y-0.5">
          <Link href={href} className="hover:underline">
            <h3 className="truncate text-base font-semibold">
              {location?.name ?? "Unknown location"}
            </h3>
          </Link>
          <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            {location?.city ?? "Unknown city"}
            {location?.country ? `, ${location.country}` : ""}
          </p>
        </div>

        {features.length ? (
          <div className="flex flex-wrap gap-1.5">
            {visible.map((item) => (
              <Badge key={item.label} variant={item.variant}>
                {item.label}
              </Badge>
            ))}
            {extra > 0 && <Badge variant="outline">+{extra}</Badge>}
          </div>
        ) : (
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Accessibility className="size-3.5" />
            No accessibility details yet
          </p>
        )}

        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
          <span className="text-xs text-muted-foreground">
            Saved {timeAgo(favorite.createdAt)}
          </span>

          <div className="flex items-center gap-2">
            <Link
              href={href}
              className={buttonVariants({ variant: "outline", size: "xs" })}
            >
              View
            </Link>
            <ActionButton
              action={removeFavorite.bind(null, favorite.id)}
              label="Remove"
              variant="destructive"
              size="xs"
              confirm="Remove this favorite?"
            />
          </div>
        </div>
      </div>
    </article>
  );
}
