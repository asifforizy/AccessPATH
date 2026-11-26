import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

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
  getReport,
  getReportHistory,
  getReportVerification,
} from "@/services/reports";

import { ReportActions } from "./_components/report-actions";

type Params = Promise<{ reportId: string }>;

export default async function ReportDetailPage({ params }: { params: Params }) {
  const { reportId } = await params;

  const [report, history, verification] = await Promise.all([
    getReport(reportId),
    getReportHistory(reportId),
    getReportVerification(reportId),
  ]);

  if (!report.data) notFound();

  const data = report.data;

  return (
    <div className="space-y-6">
      <Link
        href="/reports"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to reports
      </Link>

      <PageHeader
        title={data.location?.name ?? "Report details"}
        description={data.description}
      >
        <StatusBadge status={data.status} />
        <Badge variant="outline">{data.type.replaceAll("_", " ")}</Badge>
      </PageHeader>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Report information</CardTitle>
            <CardDescription>
              Submitted {formatDate(data.createdAt)} by{" "}
              {data.reporter?.name ?? "you"}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Location</p>
                <p className="font-medium">
                  {data.location?.name ?? "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">City</p>
                <p className="font-medium">
                  {data.location?.city ?? "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last updated</p>
                <p className="font-medium">{timeAgo(data.updatedAt)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Verification</p>
                <p className="font-medium">
                  {verification.data?.verified ? "Verified" : "Not verified"}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Description</p>
              <p className="mt-1 whitespace-pre-wrap">{data.description}</p>
            </div>

            <div>
              <p className="text-xs text-muted-foreground">Attachments</p>
              {data.attachments?.length ? (
                <ul className="mt-1 space-y-1">
                  {data.attachments.map((attachment) => (
                    <li key={attachment.id}>
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {attachment.url}
                      </a>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-1 text-muted-foreground">No attachments.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>History</CardTitle>
            <CardDescription>Audit trail for this report.</CardDescription>
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

      <Card>
        <CardHeader>
          <CardTitle>Manage report</CardTitle>
          <CardDescription>
            Update the status, add an attachment, or delete the report.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportActions reportId={data.id} status={data.status} />
        </CardContent>
      </Card>
    </div>
  );
}

// Every surface here is cookie-authenticated and dynamic; allow blocking render.
export const instant = false;
