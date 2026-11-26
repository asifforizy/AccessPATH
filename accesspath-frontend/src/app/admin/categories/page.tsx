import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAdminCategories } from "@/services/admin";

import { CategoryForm } from "./_components/category-form";

export default async function AdminCategoriesPage() {
  const res = await getAdminCategories();
  const categories = res.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Category management"
        description="Create categories, rename them, or deactivate ones that are no longer used."
      >
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:underline"
        >
          Back to admin
        </Link>
      </PageHeader>

      <CategoryForm />

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            {categories.length} categories · categories in use are deactivated
            instead of deleted.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {categories.length === 0 && (
            <p className="text-sm text-muted-foreground">No categories yet.</p>
          )}

          {categories.map((category) => (
            <div
              key={category.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{category.name}</p>
                <p className="text-xs text-muted-foreground">
                  /{category.slug} · {category.locationCount} location(s)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={category.isActive ? "success" : "outline"}>
                  {category.isActive ? "Active" : "Inactive"}
                </Badge>
                <CategoryForm mode="edit" category={category} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
