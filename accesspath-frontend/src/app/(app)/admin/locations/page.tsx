import Link from "next/link";

import { ActionButton } from "@/components/shared/action-button";
import { PageHeader } from "@/components/shared/page-header";
import { Pager } from "@/components/shared/pager";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  archiveAdminLocation,
  getAdminCategories,
  getAdminLocations,
} from "@/services/admin";

type SearchParams = Promise<{
  page?: string;
  q?: string;
  status?: string;
  categoryId?: string;
}>;

const statuses = ["", "PENDING", "APPROVED", "REJECTED", "ARCHIVED"];

async function archiveLocationAction(locationId: string) {
  "use server";
  return archiveAdminLocation(locationId);
}

export default async function AdminLocationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const {
    page = "1",
    q = "",
    status = "",
    categoryId = "",
  } = await searchParams;

  const [res, categoriesRes] = await Promise.all([
    getAdminLocations({
      page: Number(page) || 1,
      limit: 20,
      q: q || undefined,
      status: status || undefined,
      categoryId: categoryId || undefined,
    }),
    getAdminCategories(),
  ]);

  const locations = res.data ?? [];
  const categories = categoriesRes.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Location management"
        description="Edit location records, accessibility data, and archive outdated places."
      >
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:underline"
        >
          Back to admin
        </Link>
      </PageHeader>

      <form method="get" className="flex flex-wrap items-end gap-2">
        <label htmlFor="location-search" className="text-xs">
          <span className="mb-1 block text-muted-foreground">Search</span>
          <Input
            id="location-search"
            name="q"
            defaultValue={q}
            placeholder="Name, address or city"
            className="h-9 w-60"
          />
        </label>
        <label htmlFor="location-status" className="text-xs">
          <span className="mb-1 block text-muted-foreground">Status</span>
          <Select
            id="location-status"
            name="status"
            defaultValue={status}
            className="h-9 w-36"
          >
            {statuses.map((item) => (
              <option key={item || "all"} value={item}>
                {item || "All statuses"}
              </option>
            ))}
          </Select>
        </label>
        <label htmlFor="location-category" className="text-xs">
          <span className="mb-1 block text-muted-foreground">Category</span>
          <Select
            id="location-category"
            name="categoryId"
            defaultValue={categoryId}
            className="h-9 w-48"
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </label>
        <button
          type="submit"
          className="h-9 rounded-lg border px-3 text-sm hover:bg-muted"
        >
          Filter
        </button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Locations</CardTitle>
          <CardDescription>{res.meta?.total ?? 0} records</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {locations.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No locations match these filters.
            </p>
          )}

          {locations.map((location) => (
            <div
              key={location.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{location.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {location.address}, {location.city}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-1 text-[11px]">
                  <StatusBadge status={location.status} />
                  {location.category && (
                    <span className="text-muted-foreground">
                      {location.category.name} ·{" "}
                    </span>
                  )}
                  <span className="text-muted-foreground">
                    {location._count.reports} reports ·{" "}
                    {location._count.reviews} reviews
                    {location.accessibility
                      ? ` · score ${location.accessibility.accessibilityScore}`
                      : " · no accessibility data"}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/locations/${location.id}`}
                  className="rounded-md border px-2.5 py-1 text-xs hover:bg-muted"
                >
                  Edit
                </Link>
                {location.status !== "ARCHIVED" && (
                  <ActionButton
                    action={archiveLocationAction.bind(null, location.id)}
                    label="Archive"
                    variant="destructive"
                    size="xs"
                    confirm="Archive this location? Reports and reviews are kept."
                  />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Pager
        page={res.meta?.page ?? 1}
        totalPages={res.meta?.totalPages ?? 1}
        basePath="/admin/locations"
        params={{ q, status, categoryId }}
      />
    </div>
  );
}
