import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ActionButton } from "@/components/shared/action-button";
import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDate, timeAgo } from "@/lib/format";
import {
  deleteContribution,
  getContribution,
  getContributionHistory,
} from "@/services/contributions";

type Params = Promise<{ contributionId: string }>;

export default async function ContributionDetailPage({
  params,
}: {
  params: Params;
}) {
  const { contributionId } = await params;

  const [contribution, history] = await Promise.all([
    getContribution(contributionId),
    getContributionHistory(contributionId),
  ]);

  if (!contribution.data) notFound();

  const data = contribution.data;

  return (
    <div className="space-y-6">
      <Link
        href="/contribute"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to contributions
      </Link>

      <PageHeader
        title={data.title ?? "Contribution"}
        description={data.description ?? "No description provided."}
      >
        <StatusBadge status={data.status} />
        <Badge variant="outline">{data.type.replaceAll("_", " ")}</Badge>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Proposed data</CardTitle>
            <CardDescription>
              Submitted {formatDate(data.createdAt)} by{" "}
              {data.submittedBy?.name ?? "you"}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-4 text-xs">
              {JSON.stringify(data.proposedData, null, 2)}
            </pre>

            {data.reviewNote && (
              <div className="mt-3 rounded-md border p-3 text-sm">
                <p className="text-xs font-medium text-muted-foreground">
                  Reviewer note
                </p>
                <p className="mt-1">{data.reviewNote}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
            <CardDescription>Audit trail.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.data?.length ? (
              history.data.map((entry) => (
                <div key={entry.id} className="text-sm">
                  <p className="font-medium">
                    {entry.action.replaceAll("_", " ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.actor?.name ?? "System"} · {timeAgo(entry.createdAt)}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">
                No history recorded.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <ActionButton
        action={deleteContribution.bind(null, data.id)}
        label="Delete contribution"
        variant="destructive"
        confirm="Delete this contribution permanently?"
      />
    </div>
  );
}

// Every surface here is cookie-authenticated and dynamic; allow blocking render.
export const instant = false;
