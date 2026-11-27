import { ArrowRight, FileWarning } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { timeAgo } from "@/lib/format";
import type { getMyReports } from "@/services/reports";

type Report = NonNullable<Awaited<ReturnType<typeof getMyReports>>["data"]>[number];

export function RecentReportsCard({ reports }: { reports: Report[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileWarning className="size-4 text-primary" />
          Recent reports
        </CardTitle>
        <CardDescription>Your latest accessibility reports.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {reports.length ? (
          reports.map((report) => (
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
  );
}