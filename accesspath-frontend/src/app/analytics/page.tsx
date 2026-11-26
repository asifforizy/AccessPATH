import { redirect } from "next/navigation";

import {
  AccessibilityDistributionChart,
  CategoryDistributionChart,
  MonthlyTrendsChart,
} from "@/components/charts/analytics-charts";
import { PageHeader } from "@/components/shared/page-header";
import { StatGrid } from "@/components/shared/stat-grid";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getAccessibilityDistribution,
  getAnalyticsOverview,
  getCategoryDistribution,
  getContributionAnalytics,
  getHeatmap,
  getLocationAnalytics,
  getModerationAnalytics,
  getMonthlyTrends,
  getReportAnalytics,
  getTopBarrierAreas,
  getUserAnalytics,
} from "@/services/analytics";
import { getUserMe } from "@/services/me";

function RecordList({ record }: { record: Record<string, number> }) {
  const entries = Object.entries(record);

  if (!entries.length) {
    return <p className="text-xs text-muted-foreground">No data.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {entries.map(([key, value]) => (
        <Badge key={key} variant="outline">
          {key.replaceAll("_", " ")}: {value}
        </Badge>
      ))}
    </div>
  );
}

export default async function AnalyticsPage() {
  const user = await getUserMe();

  if (!user) redirect("/login");

  if (user.role !== "ADMIN" && user.role !== "MODERATOR") {
    redirect("/dashboard");
  }

  const [
    overview,
    locations,
    reports,
    contributions,
    users,
    moderation,
    trends,
    topAreas,
    categories,
    accessibility,
    heatmap,
  ] = await Promise.all([
    getAnalyticsOverview(),
    getLocationAnalytics(),
    getReportAnalytics(),
    getContributionAnalytics(),
    getUserAnalytics(),
    getModerationAnalytics(),
    getMonthlyTrends(12),
    getTopBarrierAreas(10),
    getCategoryDistribution(),
    getAccessibilityDistribution(),
    getHeatmap(500),
  ]);

  const data = overview.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Platform-wide activity, moderation, and accessibility trends."
      />

      <StatGrid
        items={[
          { label: "Users", value: data?.users ?? 0 },
          { label: "Locations", value: data?.locations ?? 0 },
          { label: "Reports", value: data?.reports ?? 0 },
          { label: "Contributions", value: data?.contributions ?? 0 },
          { label: "Reviews", value: data?.reviews ?? 0 },
          { label: "Favorites", value: data?.favorites ?? 0 },
          { label: "Pending", value: data?.pending.total ?? 0 },
          {
            label: "New users (30d)",
            value: users.data?.newUsersLast30Days ?? 0,
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Locations</CardTitle>
            <CardDescription>
              {locations.data?.total ?? 0} locations · average score{" "}
              {locations.data?.averageAccessibilityScore?.toFixed(1) ?? "0.0"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <RecordList record={locations.data?.byStatus ?? {}} />

            <div className="space-y-1 text-xs">
              {locations.data?.topCities?.map((city) => (
                <div
                  key={city.city}
                  className="flex items-center justify-between"
                >
                  <span>{city.city}</span>
                  <span className="text-muted-foreground">{city.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reports</CardTitle>
            <CardDescription>
              {reports.data?.total ?? 0} reports submitted.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <RecordList record={reports.data?.byStatus ?? {}} />
            <RecordList record={reports.data?.byType ?? {}} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contributions</CardTitle>
            <CardDescription>
              {contributions.data?.total ?? 0} contributions submitted.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <RecordList record={contributions.data?.byStatus ?? {}} />
            <RecordList record={contributions.data?.byType ?? {}} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>
              {users.data?.total ?? 0} active users.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <RecordList record={users.data?.byRole ?? {}} />
            <RecordList record={users.data?.byStatus ?? {}} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Moderation</CardTitle>
            <CardDescription>Pending work and flagged content.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>Pending reports: {moderation.data?.pendingReports ?? 0}</p>
            <p>Under review: {moderation.data?.underReviewReports ?? 0}</p>
            <p>Resolved: {moderation.data?.resolvedReports ?? 0}</p>
            <p>
              Pending contributions:{" "}
              {moderation.data?.pendingContributions ?? 0}
            </p>
            <p>Flagged: {moderation.data?.flaggedSubmissions ?? 0}</p>
            <p>Reviews: {moderation.data?.totalReviews ?? 0}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Accessibility distribution</CardTitle>
            <CardDescription>
              {accessibility.data?.total ?? 0} profiles ·{" "}
              {accessibility.data?.verified ?? 0} verified.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AccessibilityDistributionChart
              data={accessibility.data?.buckets ?? []}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly trends</CardTitle>
          <CardDescription>Activity over the last 12 months.</CardDescription>
        </CardHeader>
        <CardContent>
          <MonthlyTrendsChart data={trends.data ?? []} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top barrier areas</CardTitle>
            <CardDescription>
              Areas with the most accessibility reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            {topAreas.data?.length ? (
              topAreas.data.map((area) => (
                <div
                  key={area.area}
                  className="flex items-center justify-between"
                >
                  <span>{area.area}</span>
                  <span className="text-muted-foreground">{area.count}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground">No data.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category distribution</CardTitle>
            <CardDescription>Locations per category.</CardDescription>
          </CardHeader>
          <CardContent>
            {categories.data?.length ? (
              <CategoryDistributionChart data={categories.data} />
            ) : (
              <p className="text-xs text-muted-foreground">No data.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Heatmap points</CardTitle>
          <CardDescription>
            {heatmap.data?.total ?? 0} locations weighted by report count.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-125 text-left text-xs">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-2">Location</th>
                <th>Latitude</th>
                <th>Longitude</th>
                <th>Weight</th>
              </tr>
            </thead>
            <tbody>
              {heatmap.data?.points?.slice(0, 25).map((point) => (
                <tr key={point.locationId} className="border-t">
                  <td className="py-1.5 font-medium">{point.name}</td>
                  <td>{point.latitude.toFixed(5)}</td>
                  <td>{point.longitude.toFixed(5)}</td>
                  <td>{point.weight}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// Every surface here is cookie-authenticated and dynamic; allow blocking render.
export const instant = false;
