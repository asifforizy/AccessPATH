import { ArrowLeft, Globe, MapPin, Phone, Star, User } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionButton } from "@/components/shared/action-button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { timeAgo } from "@/lib/format";
import {
  addFavorite,
  checkFavorite,
  removeFavoriteByLocation,
} from "@/services/favorites";
import { getLocation } from "@/services/locations";

type Params = Promise<{ locationId: string }>;

const accessibilityFeatures: Array<{ key: string; label: string }> = [
  { key: "wheelchairAccessible", label: "Wheelchair accessible" },
  { key: "rampAvailable", label: "Ramp available" },
  { key: "elevatorAvailable", label: "Elevator" },
  { key: "accessibleRestroom", label: "Accessible restroom" },
  { key: "accessibleParking", label: "Accessible parking" },
  { key: "stepFreeEntrance", label: "Step-free entrance" },
  { key: "tactilePaving", label: "Tactile paving" },
  { key: "brailleSignage", label: "Braille signage" },
  { key: "hearingLoop", label: "Hearing loop" },
];

export default async function LocationDetailPage({
  params,
}: {
  params: Params;
}) {
  const { locationId } = await params;

  const [res, favorite] = await Promise.all([
    getLocation(locationId),
    checkFavorite(locationId),
  ]);

  if (!res.data) notFound();

  const location = res.data;
  const accessibility = location.accessibility;
  const isFavorite = favorite.data?.isFavorite ?? false;

  return (
    <div className="space-y-6">
      <Link
        href="/explore"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back to explore
      </Link>

      <PageHeader
        title={location.name}
        description={location.description ?? undefined}
      >
        <div className="flex flex-wrap gap-2">
          {location.category && (
            <Badge variant="outline">{location.category.name}</Badge>
          )}
          {accessibility?.isVerified && (
            <Badge variant="success">Verified</Badge>
          )}
          <ActionButton
            action={
              isFavorite
                ? removeFavoriteByLocation.bind(null, location.id)
                : addFavorite.bind(null, location.id)
            }
            label={isFavorite ? "Remove favorite" : "Save to favorites"}
          />
        </div>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Location details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <MapPin className="size-4 text-primary" />
              {location.address}, {location.city}
              {location.state ? `, ${location.state}` : ""}, {location.country}
              {location.postalCode ? ` ${location.postalCode}` : ""}
            </p>
            {location.phone && (
              <p className="flex items-center gap-2">
                <Phone className="size-4 text-primary" />
                <a href={`tel:${location.phone}`} className="hover:underline">
                  {location.phone}
                </a>
              </p>
            )}
            {location.website && (
              <p className="flex items-center gap-2">
                <Globe className="size-4 text-primary" />
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
            <p className="text-xs text-muted-foreground">
              Coordinates: {location.latitude}, {location.longitude}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="size-4 text-primary" />
              Accessibility
            </CardTitle>
            <CardDescription>
              {typeof accessibility?.accessibilityScore === "number"
                ? `Score ${accessibility.accessibilityScore}/100`
                : "No profile yet"}
              {" · "}
              {location._count?.favorites ?? 0} saved
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {accessibilityFeatures.map(({ key, label }) =>
                accessibility?.[key] ? (
                  <Badge key={key} variant="success">
                    {label}
                  </Badge>
                ) : null,
              )}
              {!accessibility && (
                <p className="text-xs text-muted-foreground">
                  Accessibility details have not been added yet.
                </p>
              )}
            </div>
            {accessibility?.notes && (
              <p className="text-xs text-muted-foreground">
                {accessibility.notes}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {location.photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Photos</CardTitle>
            <CardDescription>
              {location.photos.length} photo(s) uploaded by the community.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {location.photos.map((photo) => (
              <a
                key={photo.id}
                href={photo.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border px-3 py-1.5 text-xs hover:bg-muted"
              >
                {photo.isPrimary ? "Primary photo" : "Photo"}
              </a>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Reviews</CardTitle>
          <CardDescription>
            {location.averageRating != null
              ? `Average rating ${location.averageRating}/5 from ${location.reviewCount ?? 0} review(s).`
              : "No reviews yet."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {location.reviews.length ? (
            location.reviews.map((review) => (
              <div key={review.id} className="rounded-lg border p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 font-medium">
                      <User className="size-3.5 text-muted-foreground" />
                      {review.user?.name ?? "Anonymous"}
                    </p>
                    {review.comment && (
                      <p className="mt-1 text-muted-foreground">
                        {review.comment}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant="warning">{review.rating}/5</Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {timeAgo(review.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No reviews yet"
              description="Be the first to share how accessible this place is from the feedback page."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Every surface here is cookie-authenticated and dynamic; allow blocking render.
export const instant = false;
