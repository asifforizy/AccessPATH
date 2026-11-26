import { FileWarning } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Pager } from "@/components/shared/pager";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { timeAgo } from "@/lib/format";
import { getReports } from "@/services/reports";

import { ReportForm } from "./_components/report-form";

type SearchParams = Promise<{ page?: string; status?: string }>;

const statuses = ["", "PENDING", "UNDER_REVIEW", "RESOLVED", "REJECTED"];

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { page = "1", status = "" } = await searchParams;

  const res = await getReports({
    page: Number(page) || 1,
    limit: 10,
    status: status || undefined,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports"
        description="Submit and track accessibility reports for locations you care about."
      />

      <ReportForm />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Your reports</h2>

        <form className="flex items-center gap-2" method="get">
          <Select
            name="status"
            defaultValue={status}
            className="w-44"
            aria-label="Filter by status"
          >
            {statuses.map((item) => (
              <option key={item || "all"} value={item}>
                {item ? item.replaceAll("_", " ") : "All statuses"}
              </option>
            ))}
          </Select>
          <button
            type="submit"
            className="h-8 rounded-lg border px-3 text-sm hover:bg-muted"
          >
            Filter
          </button>
        </form>
      </div>

      {res.data?.length ? (
        <div className="space-y-3">
          {res.data.map((report) => (
            <Card key={report.id} size="sm">
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/reports/${report.id}`}
                      className="text-sm font-semibold hover:underline"
                    >
                      {report.location?.name ?? "Unknown location"}
                    </Link>
                    <StatusBadge status={report.status} />
                    <Badge variant="outline">
                      {report.type.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {report.description}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
                  <span>{timeAgo(report.createdAt)}</span>
                  <Link
                    href={`/reports/${report.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    View
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No reports found"
          description="Create a report above or change the status filter."
        />
      )}

      <Pager
        page={res.meta?.page ?? 1}
        totalPages={res.meta?.totalPages ?? 1}
        basePath="/reports"
        params={{ status }}
      />

      {res.success === false && (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <FileWarning className="size-4" />
          {res.message}
        </p>
      )}
    </div>
  );
}

// Every surface here is cookie-authenticated and dynamic; allow blocking render.
export const instant = false;
