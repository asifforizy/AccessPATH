import { ArrowLeft, ExternalLink, Info } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ContributionBreakdown } from "@/components/contribution/contribution-breakdown";
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
import { apiFetch } from "@/lib/api";
import { typeBlurb, typeLabel } from "@/lib/contribution";
import { formatDate, timeAgo } from "@/lib/format";
import {
  deleteContribution,
  getContribution,
  getContributionHistory,
} from "@/services/contributions";
import type { IPlaceCategory, IPlaceDetail } from "@/types/place.types";

type Params = Promise<{ contributionId: string }>;

const actionLabel = (action: string) =>
  action
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const nextStep = (status: string) => {
  switch (status) {
    case "PENDING":
      return "A moderator compares this with the place and its evidence. The status on this page changes as soon as they decide — nothing is published in the meantime.";
    case "APPROVED":
      return "Approved. These details are live on the place now.";
    case "REJECTED":
      return "Not accepted this time. The moderator's reason is shown above; you can send a corrected submission from the Contribute page.";
    default:
      return "This submission is closed.";
  }
};

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

  const [categoriesRes, placeRes] = await Promise.all([
    apiFetch<IPlaceCategory[]>("/places/categories"),
    data.type !== "LOCATION_CREATE" && data.locationId
      ? apiFetch<IPlaceDetail>(`/places/${data.locationId}`)
      : Promise.resolve({ success: true, data: null }),
  ]);

  const categoryId = (data.proposedData as { categoryId?: string } | null)
    ?.categoryId;
  const categoryName =
    categoriesRes.data?.find((item) => item.id === categoryId)?.name ?? null;
  const currentPlace = placeRes.success ? (placeRes.data ?? null) : null;

  return (
    <div className="space-y-6">
      <Link
        href="/contribute#my-contributions"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to contributions
      </Link>

      <PageHeader
        title={data.title ?? typeLabel(data.type)}
        description={data.description ?? typeBlurb(data.type)}
      >
        <StatusBadge status={data.status} />
        <Badge variant="outline">{typeLabel(data.type)}</Badge>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ContributionBreakdown
            contribution={data}
            currentPlace={currentPlace}
            categoryName={categoryName}
          />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
              <CardDescription>{nextStep(data.status)}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Review state</dt>
                  <dd>
                    <StatusBadge status={data.status} />
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Submitted</dt>
                  <dd className="text-right" title={formatDate(data.createdAt)}>
                    {timeAgo(data.createdAt)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Submitted by</dt>
                  <dd className="text-right">
                    {data.submittedBy?.name ?? "You"}
                  </dd>
                </div>
                {data.reviewedAt && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-muted-foreground">Reviewed</dt>
                    <dd
                      className="text-right"
                      title={formatDate(data.reviewedAt)}
                    >
                      {timeAgo(data.reviewedAt)}
                      {data.reviewedBy?.name
                        ? ` by ${data.reviewedBy.name}`
                        : ""}
                    </dd>
                  </div>
                )}
              </dl>

              {data.locationId && (
                <Link
                  href={`/explore/${data.locationId}`}
                  className="mt-3 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <ExternalLink aria-hidden="true" className="size-3.5" />
                  Open the place
                </Link>
              )}
            </CardContent>
          </Card>

          {data.reviewNote && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-1.5">
                  <Info aria-hidden="true" className="size-4 text-primary" />
                  Moderator note
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{data.reviewNote}</p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
              <CardDescription>
                Every step this submission went through.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {history.data?.length ? (
                <ol className="space-y-3">
                  {history.data.map((entry) => (
                    <li key={entry.id} className="flex gap-2.5 text-sm">
                      <span
                        aria-hidden="true"
                        className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary"
                      />
                      <span>
                        <span className="block font-medium">
                          {actionLabel(entry.action)}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {entry.actor?.name ?? "System"} ·{" "}
                          {timeAgo(entry.createdAt)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No activity recorded yet.
                </p>
              )}
            </CardContent>
          </Card>

          <ActionButton
            action={deleteContribution.bind(null, data.id)}
            label="Delete contribution"
            variant="destructive"
            size="sm"
            confirm="Delete this contribution permanently?"
          />
        </div>
      </div>
    </div>
  );
}

// Every surface here is cookie-authenticated and dynamic; allow blocking render.
export const instant = false;
