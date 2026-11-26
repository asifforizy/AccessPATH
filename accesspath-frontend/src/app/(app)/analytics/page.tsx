import { redirect } from "next/navigation";

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
          <CardContent className="space-y-2">
            {accessibility.data?.buckets?.map((bucket) => {
              const total = accessibility.data?.total ?? 0;
              const width = total ? (bucket.count / total) * 100 : 0;

              return (
                <div
                  key={bucket.range}
                  className="flex items-center gap-2 text-xs"
                >
                  <span className="w-14">{bucket.range}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-muted-foreground">
                    {bucket.count}
                  </span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly trends</CardTitle>
          <CardDescription>Activity over the last 12 months.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-125 text-left text-xs">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-2">Month</th>
                <th>Users</th>
                <th>Locations</th>
                <th>Reports</th>
                <th>Contributions</th>
                <th>Reviews</th>
              </tr>
            </thead>
            <tbody>
              {trends.data?.map((row) => (
                <tr key={row.month} className="border-t">
                  <td className="py-1.5 font-medium">{row.month}</td>
                  <td>{row.users}</td>
                  <td>{row.locations}</td>
                  <td>{row.reports}</td>
                  <td>{row.contributions}</td>
                  <td>{row.reviews}</td>
                </tr>
              ))}
            </tbody>
          </table>
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
          <CardContent className="space-y-1 text-sm">
            {categories.data?.length ? (
              categories.data.map((category) => (
                <div
                  key={category.categoryId}
                  className="flex items-center justify-between"
                >
                  <span>{category.name}</span>
                  <span className="text-muted-foreground">
                    {category.count}
                  </span>
                </div>
              ))
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
