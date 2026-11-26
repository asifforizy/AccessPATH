import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { getAdminCategories } from "@/services/admin";
import { getLocation } from "@/services/locations";

import { LocationEditor } from "./_components/location-editor";

type Params = Promise<{ locationId: string }>;

export default async function AdminLocationDetailPage({
  params,
}: {
  params: Params;
}) {
  const { locationId } = await params;

  const [res, categoriesRes] = await Promise.all([
    getLocation(locationId),
    getAdminCategories(),
  ]);

  if (!res.data) notFound();

  const location = res.data;

  return (
    <div className="space-y-6">
      <Link
        href="/admin/locations"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-3.5" /> Back to locations
      </Link>

      <PageHeader title={location.name} description={location.address}>
        <Badge variant="outline">{location.status}</Badge>
      </PageHeader>

      <LocationEditor
        location={{
          id: location.id,
          name: location.name,
          description: location.description ?? "",
          address: location.address,
          city: location.city,
          state: location.state ?? "",
          country: location.country,
          postalCode: location.postalCode ?? "",
          phone: location.phone ?? "",
          website: location.website ?? "",
          latitude: location.latitude,
          longitude: location.longitude,
          categoryId: location.category?.id ?? "",
          status: location.status,
          accessibility: location.accessibility ?? null,
        }}
        categories={(categoriesRes.data ?? []).map((category) => ({
          id: category.id,
          name: category.name,
        }))}
      />
    </div>
  );
}
