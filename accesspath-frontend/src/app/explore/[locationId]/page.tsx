import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  FileWarning,
  Globe,
  ImagePlus,
  MapPin,
  MessageSquarePlus,
  Phone,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { osmPlaceUrl } from "@/lib/geo";
import {
  addFavorite,
  checkFavorite,
  removeFavoriteByLocation,
} from "@/services/favorites";
import { getLocation } from "@/services/locations";

import { AccessibilityCard } from "./_components/accessibility-card";
import { LocationHero } from "./_components/location-hero";
import { LocationMapPreview } from "./_components/location-map-preview";
import { NoPhotosYet, PhotoGallery } from "./_components/photo-gallery";
import { ReviewSection } from "./_components/review-section";

type Params = Promise<{ locationId: string }>;

/** Same request, same payload: share one fetch between metadata and the page. */
const getLocationCached = cache(getLocation);

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { locationId } = await params;
  const res = await getLocationCached(locationId);
  const location = res.data;

  if (!location) return { title: "Location not found · AccessPath" };

  return {
    title: `${location.name} · AccessPath`,
    description:
      location.description ??
      `Accessibility details for ${location.name} in ${location.city}.`,
  };
}

const contributeLinks = [
  {
    href: "/feedback",
    label: "Share your experience",
    hint: "Write a review",
    icon: MessageSquarePlus,
  },
  {
    href: "/reports",
    label: "Report a barrier",
    hint: "Something broken or missing",
    icon: FileWarning,
  },
  {
    href: "/uploads",
    label: "Add a photo",
    hint: "Show the entrance or route",
    icon: ImagePlus,
  },
];

export default async function LocationDetailPage({
  params,
}: {
  params: Params;
}) {
  const { locationId } = await params;

  const [res, favorite] = await Promise.all([
    getLocationCached(locationId),
    checkFavorite(locationId),
  ]);

  if (!res.data) notFound();

  const location = res.data;
  const isFavorite = favorite.data?.isFavorite ?? false;
  const primaryPhoto =
    location.photos.find((photo) => photo.isPrimary) ?? location.photos[0];
  const hasPhoto = location.photos.length > 0;

  return (
    <div className="space-y-5">
      <Link
        href="/explore"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft aria-hidden="true" className="size-3.5" />
        Back to explore
      </Link>

      <LocationHero
        location={location}
        photoUrl={primaryPhoto?.url ?? null}
        isFavorite={isFavorite}
        favoriteAction={
          isFavorite
            ? removeFavoriteByLocation.bind(null, location.id)
            : addFavorite.bind(null, location.id)
        }
      />

      {location.description && (
        <p className="max-w-3xl text-sm text-muted-foreground">
          {location.description}
        </p>
      )}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0 space-y-5">
          <AccessibilityCard accessibility={location.accessibility} />

          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>
                {hasPhoto
                  ? `${location.photos.length} photo${location.photos.length === 1 ? "" : "s"} shared by the community.`
                  : "Community photos of entrances, ramps and accessible routes."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {location.photos.length > 1 ? (
                <PhotoGallery photos={location.photos} name={location.name} />
              ) : hasPhoto ? (
                <p className="text-xs text-muted-foreground">
                  This place has one photo — it is shown at the top of the page.
                </p>
              ) : (
                <NoPhotosYet />
              )}
            </CardContent>
          </Card>

          <ReviewSection
            reviews={location.reviews}
            averageRating={location.averageRating}
            reviewCount={location.reviewCount}
          />
        </div>

        <aside className="min-w-0 space-y-5 self-start lg:sticky lg:top-20">
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
              <CardDescription>
                {location.city}
                {location.state ? `, ${location.state}` : ""} ·{" "}
                {location.country}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              <LocationMapPreview
                latitude={location.latitude}
                longitude={location.longitude}
                name={location.name}
              />

              <div className="space-y-2 text-sm">
                <p className="flex items-start gap-2">
                  <MapPin
                    aria-hidden="true"
                    className="mt-0.5 size-4 shrink-0 text-primary"
                  />
                  <span>
                    {location.address}
                    {location.postalCode ? `, ${location.postalCode}` : ""}
                  </span>
                </p>

                {location.phone && (
                  <p className="flex items-center gap-2">
                    <Phone
                      aria-hidden="true"
                      className="size-4 shrink-0 text-primary"
                    />
                    <a
                      href={`tel:${location.phone}`}
                      className="truncate hover:underline"
                    >
                      {location.phone}
                    </a>
                  </p>
                )}

                {location.website && (
                  <p className="flex items-center gap-2">
                    <Globe
                      aria-hidden="true"
                      className="size-4 shrink-0 text-primary"
                    />
                    <a
                      href={location.website}
                      target="_blank"
                      rel="noreferrer"
                      className="truncate hover:underline"
                    >
                      {location.website}
                    </a>
                  </p>
                )}
              </div>

              <div className="space-y-1 border-t border-border pt-3 text-xs">
                <Link
                  href={`/routes?destinationId=${location.id}`}
                  className="flex items-center justify-between gap-2 rounded-md px-1 py-1 text-muted-foreground hover:text-foreground"
                >
                  Plan an accessible route
                  <ChevronRight aria-hidden="true" className="size-3.5" />
                </Link>
                <a
                  href={osmPlaceUrl(location.latitude, location.longitude)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-2 rounded-md px-1 py-1 text-muted-foreground hover:text-foreground"
                >
                  Open in OpenStreetMap
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                </a>
                <p className="px-1 pt-1 font-mono text-[11px] text-muted-foreground">
                  {location.latitude.toFixed(5)},{" "}
                  {location.longitude.toFixed(5)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Help keep this accurate</CardTitle>
              <CardDescription>
                One review or photo can unblock someone&rsquo;s trip.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {contributeLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-2.5 rounded-lg border border-border px-2.5 py-2 transition-colors hover:bg-muted"
                  >
                    <Icon
                      aria-hidden="true"
                      className="size-4 shrink-0 text-primary"
                    />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">
                        {item.label}
                      </span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {item.hint}
                      </span>
                    </span>
                    <ChevronRight
                      aria-hidden="true"
                      className="ml-auto size-3.5 shrink-0 text-muted-foreground"
                    />
                  </Link>
                );
              })}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}

// Every surface here is cookie-authenticated and dynamic; allow blocking render.
export const instant = false;
