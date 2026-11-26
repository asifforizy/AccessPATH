import { ImageOff, MapPin, MapPinned, Star } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pager } from "@/components/shared/pager";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getLocations } from "@/services/locations";

type SearchParams = Promise<{
  page?: string;
  q?: string;
  city?: string;
  categoryId?: string;
}>;

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { page = "1", q = "", city = "", categoryId = "" } = await searchParams;

  const res = await getLocations({
    page: Number(page) || 1,
    limit: 12,
    q: q || undefined,
    city: city || undefined,
    categoryId: categoryId || undefined,
  });

  const locations = res.data ?? [];
  const meta = res.meta;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Explore locations"
        description="Browse verified accessible places, check their accessibility features, and save the ones you like."
      >
        <Badge variant="secondary">{meta?.total ?? 0} places</Badge>
        <Button
          size="sm"
          nativeButton={false}
          render={<Link href="/explore/map" />}
        >
          <MapPinned aria-hidden="true" className="size-3.5" />
          Open map explorer
        </Button>
      </PageHeader>

      <form method="get" className="flex flex-wrap items-center gap-2">
        <Input
          name="q"
          defaultValue={q}
          placeholder="Search by name, address, or description"
          className="h-9 max-w-xs"
          aria-label="Search locations"
        />
        <Input
          name="city"
          defaultValue={city}
          placeholder="City"
          className="h-9 w-40"
          aria-label="Filter by city"
        />
        {categoryId && (
          <input type="hidden" name="categoryId" value={categoryId} />
        )}
        <button
          type="submit"
          className="h-9 rounded-lg border px-4 text-sm font-medium hover:bg-muted"
        >
          Search
        </button>
        {(q || city || categoryId) && (
          <Link
            href="/explore"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Clear filters
          </Link>
        )}
      </form>

      {locations.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {locations.map((location) => {
            const accessibility = location.accessibility;
            const photo = location.photos?.[0];

            return (
              <Link
                key={location.id}
                href={`/explore/${location.id}`}
                className="group block h-full"
              >
                <Card className="h-full gap-0 overflow-hidden p-0 transition-all hover:shadow-lg hover:ring-primary/40">
                  <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-primary/15 via-muted to-background">
                    {photo ? (
                      <img
                        src={photo.url}
                        alt={location.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                        <ImageOff
                          aria-hidden="true"
                          className="size-10 text-primary/50"
                        />
                        <span className="text-xs font-medium text-muted-foreground">
                          No photo yet
                        </span>
                      </div>
                    )}

                    <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
                      {location.category && (
                        <Badge
                          variant="secondary"
                          className="bg-background/90 text-foreground shadow-sm backdrop-blur"
                        >
                          {location.category.name}
                        </Badge>
                      )}
                      {typeof accessibility?.accessibilityScore ===
                        "number" && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-background/90 px-2.5 py-1 text-xs font-semibold text-primary shadow-sm backdrop-blur">
                          <Star
                            aria-hidden="true"
                            className="size-3.5 fill-current"
                          />
                          {accessibility.accessibilityScore}
                          <span className="sr-only">out of 100</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <CardContent className="flex flex-1 flex-col gap-3 p-4">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold transition-colors group-hover:text-primary">
                        {location.name}
                      </h3>
                      <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin
                          aria-hidden="true"
                          className="size-3 shrink-0"
                        />
                        <span className="truncate">
                          {location.city}
                          {location.country ? `, ${location.country}` : ""}
                        </span>
                      </p>
                    </div>

                    {location.description && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {location.description}
                      </p>
                    )}

                    <div className="mt-auto space-y-2">
                      <div className="flex flex-wrap gap-1">
                        {accessibility?.isVerified && (
                          <Badge variant="success">Verified</Badge>
                        )}
                        {accessibility?.wheelchairAccessible && (
                          <Badge variant="success">Wheelchair</Badge>
                        )}
                        {accessibility?.rampAvailable && (
                          <Badge variant="info">Ramp</Badge>
                        )}
                        {accessibility?.elevatorAvailable && (
                          <Badge variant="info">Elevator</Badge>
                        )}
                        {accessibility?.stepFreeEntrance && (
                          <Badge variant="info">Step-free</Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {location._count?.reviews ?? 0} review(s) ·{" "}
                        {location._count?.favorites ?? 0} saved
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="No locations found"
          description={
            q || city || categoryId
              ? "Try a different search term or clear the filters."
              : "Approved locations will appear here once contributors add them."
          }
        />
      )}

      {meta && (
        <Pager
          page={meta.page}
          totalPages={meta.totalPages}
          basePath="/explore"
          params={{ q, city, categoryId }}
        />
      )}
    </div>
  );
}

// Every surface here is cookie-authenticated and dynamic; allow blocking render.
export const instant = false;
