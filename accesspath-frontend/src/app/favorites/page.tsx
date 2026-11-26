import Link from "next/link";
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
import { getFavorites, removeFavorite } from "@/services/favorites";

import { FavoriteForm } from "./_components/favorite-form";

export default async function FavoritesPage() {
  const favorites = await getFavorites({ limit: 50 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Favorites"
        description="Saved locations you can revisit quickly."
      />

      <FavoriteForm />

      <Card>
        <CardHeader>
          <CardTitle>Saved locations</CardTitle>
          <CardDescription>
            {favorites.meta?.total ?? 0} location(s) saved.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {favorites.data?.length ? (
            favorites.data.map((favorite) => {
              const location = favorite.location;
              const accessibility = location?.accessibility;

              return (
                <div
                  key={favorite.id}
                  className="rounded-lg border p-4 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {location?.name ?? "Unknown location"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {location?.city ?? "Unknown city"}
                        {location?.country ? `, ${location.country}` : ""}
                      </p>
                    </div>
                    {location?.category && (
                      <Badge variant="outline">{location.category.name}</Badge>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {accessibility?.wheelchairAccessible && (
                      <Badge variant="success">Wheelchair</Badge>
                    )}
                    {accessibility?.rampAvailable && (
                      <Badge variant="info">Ramp</Badge>
                    )}
                    {accessibility?.elevatorAvailable && (
                      <Badge variant="info">Elevator</Badge>
                    )}
                    {accessibility?.accessibleRestroom && (
                      <Badge variant="info">Restroom</Badge>
                    )}
                    {accessibility?.stepFreeEntrance && (
                      <Badge variant="info">Step-free</Badge>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      Saved {timeAgo(favorite.createdAt)}
                    </span>

                    <div className="flex gap-2">
                      {location?.photos?.[0] && (
                        <a
                          href={location.photos[0].url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex h-6 items-center rounded-md border px-2 text-xs hover:bg-muted"
                        >
                          Photo
                        </a>
                      )}
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
              );
            })
          ) : (
            <div className="md:col-span-2">
              <EmptyState
                title="No favorites yet"
                description="Browse the explore page and save the places you like."
              />
              <Link
                href="/explore"
                className="justify-self-center text-sm font-medium text-primary hover:underline"
              >
                Explore locations
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Every surface here is cookie-authenticated and dynamic; allow blocking render.
export const instant = false;
