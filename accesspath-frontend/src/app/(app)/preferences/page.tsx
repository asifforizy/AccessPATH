import { Sparkles } from "lucide-react";

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
import {
  getAccessibilityPreferences,
  getPreferences,
  getRecommendations,
} from "@/services/preferences";

import { PreferencesForm } from "./_components/preferences-form";

export default async function PreferencesPage() {
  const [preferences, accessibility, recommendations] = await Promise.all([
    getPreferences(),
    getAccessibilityPreferences(),
    getRecommendations(8),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Preferences"
        description="Control how AccessPath plans routes and recommends accessible places."
      />

      <PreferencesForm
        preferences={preferences.data ?? {}}
        accessibility={accessibility.data?.accessibilityNeeds ?? {}}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Recommended for you
          </CardTitle>
          <CardDescription>
            {recommendations.data?.matchedNeeds?.length
              ? `Matched needs: ${recommendations.data.matchedNeeds.join(", ")}`
              : "Set accessibility needs above to personalise results."}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          {recommendations.data?.data?.length ? (
            recommendations.data.data.map((location) => (
              <div
                key={location.id}
                className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{location.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {location.city ?? "Unknown city"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {location.category && (
                    <Badge variant="outline">{location.category.name}</Badge>
                  )}
                  <Badge variant="info">
                    {location.accessibility?.accessibilityScore ?? 0}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="md:col-span-2">
              <EmptyState
                title="No recommendations yet"
                description="Save accessibility needs to receive matching locations."
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Every surface here is cookie-authenticated and dynamic; allow blocking render.
export const instant = false;
