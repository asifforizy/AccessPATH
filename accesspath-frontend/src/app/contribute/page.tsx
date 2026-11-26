import Link from "next/link";

import { ActionButton } from "@/components/shared/action-button";
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
import {
  deleteContribution,
  getContributionStatistics,
  getMyContributions,
} from "@/services/contributions";

import { ContributionForm } from "./_components/contribution-form";

export default async function ContributePage() {
  const [contributions, stats] = await Promise.all([
    getMyContributions(50),
    getContributionStatistics(),
  ]);

  const byStatus = stats.data?.byStatus ?? {};

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contribute"
        description="Add accessible places or suggest corrections to existing location data."
      />

      <StatGrid
        items={[
          { label: "Total", value: stats.data?.total ?? 0 },
          { label: "Pending", value: byStatus.PENDING ?? 0 },
          { label: "Approved", value: byStatus.APPROVED ?? 0 },
          { label: "Rejected", value: byStatus.REJECTED ?? 0 },
        ]}
      />

      <ContributionForm />

      <Card>
        <CardHeader>
          <CardTitle>My contributions</CardTitle>
          <CardDescription>
            Track review status and remove submissions that are still
            actionable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {contributions.data?.length ? (
            contributions.data.map((contribution) => (
              <div
                key={contribution.id}
                className="rounded-lg border p-4 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">
                      {contribution.title ?? "Untitled contribution"}
                    </span>
                    <StatusBadge status={contribution.status} />
                    <Badge variant="outline">
                      {contribution.type.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(contribution.createdAt)}
                  </span>
                </div>

                {contribution.description && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {contribution.description}
                  </p>
                )}

                <p className="mt-2 text-xs text-muted-foreground">
                  Location:{" "}
                  {contribution.location?.name ??
                    contribution.locationId ??
                    "New location"}
                </p>

                {contribution.reviewNote && (
                  <p className="mt-2 rounded-md bg-muted px-2 py-1 text-xs">
                    Reviewer note: {contribution.reviewNote}
                  </p>
                )}

                <details className="mt-2">
                  <summary className="cursor-pointer text-xs font-medium text-primary">
                    Proposed data
                  </summary>
                  <pre className="mt-2 max-h-48 overflow-auto rounded-md bg-muted p-3 text-xs">
                    {JSON.stringify(contribution.proposedData, null, 2)}
                  </pre>
                </details>

                <div className="mt-3 flex gap-2">
                  <ActionButton
                    action={deleteContribution.bind(null, contribution.id)}
                    label="Delete"
                    variant="destructive"
                    size="xs"
                    confirm="Delete this contribution?"
                  />
                  <Link
                    href={`/contributions/${contribution.id}`}
                    className="inline-flex h-6 items-center rounded-md border px-2 text-xs hover:bg-muted"
                  >
                    Details
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="No contributions yet"
              description="Your submitted location updates will appear here."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Every surface here is cookie-authenticated and dynamic; allow blocking render.
export const instant = false;
