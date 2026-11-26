import {
  ArrowRight,
  Bell,
  Bookmark,
  FileWarning,
  MapPin,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatGrid } from "@/components/shared/stat-grid";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { timeAgo } from "@/lib/format";
import { getContributionStatistics } from "@/services/contributions";
import { getFavorites } from "@/services/favorites";
import { getUserMe } from "@/services/me";
import { getUnreadCount } from "@/services/notifications";
import { getMyReports } from "@/services/reports";

export default async function DashboardPage() {
  const user = await getUserMe();

  if (!user) redirect("/login");

  const [reports, favorites, unread, stats] = await Promise.all([
    getMyReports(3),
    getFavorites({ limit: 4 }),
    getUnreadCount(),
    getContributionStatistics(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${user.name.split(" ")[0]}`}
        description="Track your contributions, reports, saved places, and accessibility preferences."
      >
        <Badge variant="secondary">{user.role}</Badge>
      </PageHeader>

      <StatGrid
        items={[
          {
            label: "Reports",
            value: user._count.reports,
            hint: "Submitted by you",
          },
          {
            label: "Contributions",
            value: stats.data?.total ?? user._count.contributions,
            hint: "Total submitted",
          },
          {
            label: "Reviews",
            value: user._count.reviews,
            hint: "Feedback written",
          },
          {
            label: "Favorites",
            value: user._count.favorites,
            hint: "Saved locations",
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileWarning className="size-4 text-primary" />
              Recent reports
            </CardTitle>
            <CardDescription>
              Your latest accessibility reports.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.data?.length ? (
              reports.data.map((report) => (
                <Link
                  key={report.id}
                  href={`/reports/${report.id}`}
                  className="flex items-start justify-between gap-3 rounded-lg border p-3 transition-colors hover:bg-muted"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {report.location?.name ?? "Location"}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {report.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge status={report.status} />
                    <span className="text-[11px] text-muted-foreground">
                      {timeAgo(report.createdAt)}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <EmptyState
                title="No reports yet"
                description="Report an accessibility issue to help others."
              />
            )}

            <Link
              href="/reports"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              View all reports <ArrowRight className="size-3.5" />
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bookmark className="size-4 text-primary" />
              Saved places
            </CardTitle>
            <CardDescription>
              Locations you bookmarked for later.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {favorites.data?.length ? (
              favorites.data.map((favorite) => (
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
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link
          href="/notifications"
          className="rounded-xl border bg-card p-4 transition-colors hover:bg-muted"
        >
          <Bell className="size-5 text-primary" />
          <p className="mt-2 text-sm font-semibold">Notifications</p>
          <p className="text-xs text-muted-foreground">
            {unread.data?.unreadCount ?? 0} unread
          </p>
        </Link>

        <Link
          href="/contribute"
          className="rounded-xl border bg-card p-4 transition-colors hover:bg-muted"
        >
          <MapPin className="size-5 text-primary" />
          <p className="mt-2 text-sm font-semibold">Contribute</p>
          <p className="text-xs text-muted-foreground">
            Add or update location data
          </p>
        </Link>

        <Link
          href="/feedback"
          className="rounded-xl border bg-card p-4 transition-colors hover:bg-muted"
        >
          <MessageSquare className="size-5 text-primary" />
          <p className="mt-2 text-sm font-semibold">Feedback</p>
          <p className="text-xs text-muted-foreground">
            Share your accessibility experience
          </p>
        </Link>
      </div>
    </div>
  );
}

// Every surface here is cookie-authenticated and dynamic; allow blocking render.
export const instant = false;
