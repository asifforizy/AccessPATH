import { MapPin, Star } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pager } from "@/components/shared/pager";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getLocations } from "@/services/locations";

type SearchParams = Promise<{ page?: string; q?: string; city?: string }>;

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { page = "1", q = "", city = "" } = await searchParams;

  const res = await getLocations({
    page: Number(page) || 1,
    limit: 12,
    q: q || undefined,
    city: city || undefined,
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
        <button
          type="submit"
          className="h-9 rounded-lg border px-4 text-sm font-medium hover:bg-muted"
        >
          Search
        </button>
        {(q || city) && (
          <Link
            href="/explore"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Clear filters
          </Link>
        )}
      </form>

      {locations.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {locations.map((location) => {
            const accessibility = location.accessibility;

            return (
              <Link key={location.id} href={`/explore/${location.id}`}>
                <Card className="h-full transition-colors hover:border-primary/40">
                  <CardContent className="flex h-full flex-col gap-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {location.name}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="size-3 shrink-0" />
                          <span className="truncate">
                            {location.city}
                            {location.country ? `, ${location.country}` : ""}
                          </span>
                        </p>
                      </div>
                      {location.category && (
                        <Badge variant="outline">
                          {location.category.name}
                        </Badge>
                      )}
                    </div>

                    {location.description && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">
                        {location.description}
                      </p>
                    )}

                    <div className="mt-auto space-y-2">
                      {typeof accessibility?.accessibilityScore ===
                        "number" && (
                        <p className="flex items-center gap-1.5 text-xs font-medium">
                          <Star className="size-3.5 text-amber-500" />
                          Accessibility score {accessibility.accessibilityScore}
                          /100
                          {accessibility.isVerified && (
                            <Badge variant="success">Verified</Badge>
                          )}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1">
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
            q || city
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
          params={{ q, city }}
        />
      )}
    </div>
  );
}

// Every surface here is cookie-authenticated and dynamic; allow blocking render.
export const instant = false;
