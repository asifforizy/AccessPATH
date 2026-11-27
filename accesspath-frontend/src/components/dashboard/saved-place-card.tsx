import { ArrowRight, Bookmark } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { getFavorites } from "@/services/favorites";

type Favorite = NonNullable<
  Awaited<ReturnType<typeof getFavorites>>["data"]
>[number];

export function SavedPlacesCard({ favorites }: { favorites: Favorite[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bookmark className="size-4 text-primary" />
          Saved places
        </CardTitle>
        <CardDescription>Locations you bookmarked for later.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {favorites.length ? (
          favorites.map((favorite) => (
            <div
              key={favorite.id}
              className="flex items-center justify-between gap-3 rounded-lg border p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {favorite.location?.name ?? "Location"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {favorite.location?.city ?? "Unknown city"}
                </p>
              </div>
              {favorite.location?.category && (
                <Badge variant="outline">
                  {favorite.location.category.name}
                </Badge>
              )}
            </div>
          ))
        ) : (
          <EmptyState
            title="No favorites yet"
            description="Save accessible places from the explore page."
          />
        )}

        <Link
          href="/favorites"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          Manage favorites <ArrowRight className="size-3.5" />
        </Link>
      </CardContent>
    </Card>
  );
}
