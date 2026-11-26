"use client";

import { useState } from "react";

import { ActionButton } from "@/components/shared/action-button";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { timeAgo } from "@/lib/format";
import {
  approveSubmission,
  flagSubmission,
  rejectSubmission,
  requestSubmissionChanges,
  verifySubmission,
} from "@/services/moderation";
import type { IAuditLog, IContribution, IReport, IReview } from "@/utils/types";

interface ModLocation {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: string;
  category?: { id: string; name: string } | null;
  createdBy?: { id: string; name: string } | null;
}

interface ModerationPanelProps {
  contributions: IContribution[];
  reports: IReport[];
  locations: ModLocation[];
  feedback: IReview[];
  history: IAuditLog[];
}

const tabs = [
  "Queue",
  "Locations",
  "Reports",
  "Contributions",
  "Feedback",
  "History",
] as const;

type Tab = (typeof tabs)[number];

function Actions({ id }: { id: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <ActionButton
        action={(value) => approveSubmission(id, value)}
        label="Approve"
        size="xs"
        promptLabel="Approval note (optional)"
        promptPlaceholder="Looks good"
      />
      <ActionButton
        action={(value) => rejectSubmission(id, value)}
        label="Reject"
        variant="destructive"
        size="xs"
        promptLabel="Rejection reason"
        promptPlaceholder="Explain what is wrong"
      />
      <ActionButton
        action={(value) => requestSubmissionChanges(id, value)}
        label="Request changes"
        variant="outline"
        size="xs"
        promptLabel="What should the contributor change?"
      />
      <ActionButton
        action={(value) => verifySubmission(id, value)}
        label="Verify"
        variant="secondary"
        size="xs"
        promptLabel="Verification note (optional)"
      />
      <ActionButton
        action={(value) => flagSubmission(id, value)}
        label="Flag"
        variant="outline"
        size="xs"
        promptLabel="Flag reason"
      />
    </div>
  );
}

export function ModerationPanel({
  contributions,
  reports,
  locations,
  feedback,
  history,
}: ModerationPanelProps) {
  const [tab, setTab] = useState<Tab>("Queue");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-1 rounded-xl border bg-card p-1.5">
        {tabs.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setTab(item)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              tab === item
                ? "bg-primary/10 font-semibold text-primary"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      {tab === "Queue" && (
        <div className="space-y-3">
          {contributions.length + reports.length + locations.length === 0 ? (
            <EmptyState
              title="Queue is clear"
              description="No pending submissions right now."
            />
          ) : (
            <>
              {contributions.map((item) => (
                <div key={item.id} className="rounded-lg border p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">Contribution</Badge>
                    <span className="font-semibold">
                      {item.title ?? "Untitled contribution"}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.description ?? "No description"} ·{" "}
                    {timeAgo(item.createdAt)}
                  </p>
                  <div className="mt-3">
                    <Actions id={item.id} />
                  </div>
                </div>
              ))}

              {reports.map((item) => (
                <div key={item.id} className="rounded-lg border p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">Report</Badge>
                    <span className="font-semibold">
                      {item.location?.name ?? "Unknown location"}
                    </span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.description} · {timeAgo(item.createdAt)}
                  </p>
                  <div className="mt-3">
                    <Actions id={item.id} />
                  </div>
                </div>
              ))}

              {locations.map((item) => (
                <div key={item.id} className="rounded-lg border p-4 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">Location</Badge>
                    <span className="font-semibold">{item.name}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.category?.name ?? "Uncategorised"} ·{" "}
                    {timeAgo(item.createdAt)}
                  </p>
                  <div className="mt-3">
                    <Actions id={item.id} />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {tab === "Locations" && (
        <div className="space-y-3">
          {locations.length ? (
            locations.map((item) => (
              <div key={item.id} className="rounded-lg border p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{item.name}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(item.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.category?.name ?? "Uncategorised"} · by{" "}
                  {item.createdBy?.name ?? "Unknown"}
                </p>
                <div className="mt-3">
                  <Actions id={item.id} />
                </div>
              </div>
            ))
          ) : (
            <EmptyState title="No locations" />
          )}
        </div>
      )}

      {tab === "Reports" && (
        <div className="space-y-3">
          {reports.length ? (
            reports.map((item) => (
              <div key={item.id} className="rounded-lg border p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">
                      {item.location?.name ?? "Unknown location"}
                    </span>
                    <StatusBadge status={item.status} />
                    <Badge variant="outline">
                      {item.type.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(item.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.description}
                </p>
                <div className="mt-3">
                  <Actions id={item.id} />
                </div>
              </div>
            ))
          ) : (
            <EmptyState title="No reports" />
          )}
        </div>
      )}

      {tab === "Contributions" && (
        <div className="space-y-3">
          {contributions.length ? (
            contributions.map((item) => (
              <div key={item.id} className="rounded-lg border p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">
                      {item.title ?? "Untitled contribution"}
                    </span>
                    <StatusBadge status={item.status} />
                    <Badge variant="outline">
                      {item.type.replaceAll("_", " ")}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(item.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.description ?? "No description"}
                </p>
                <div className="mt-3">
                  <Actions id={item.id} />
                </div>
              </div>
            ))
          ) : (
            <EmptyState title="No contributions" />
          )}
        </div>
      )}

      {tab === "Feedback" && (
        <div className="space-y-3">
          {feedback.length ? (
            feedback.map((item) => (
              <div key={item.id} className="rounded-lg border p-4 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">
                      {item.user?.name ?? "Anonymous"}
                    </span>
                    <Badge variant="warning">{item.rating}★</Badge>
                    <span className="text-xs text-muted-foreground">
                      {item.location?.name ?? "Unknown location"}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {timeAgo(item.createdAt)}
                  </span>
                </div>
                {item.comment && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {item.comment}
                  </p>
                )}
                <div className="mt-3">
                  <ActionButton
                    action={(value) => flagSubmission(item.id, value)}
                    label="Flag"
                    size="xs"
                    promptLabel="Flag reason"
                  />
                </div>
              </div>
            ))
          ) : (
            <EmptyState title="No feedback" />
          )}
        </div>
      )}

      {tab === "History" && (
        <div className="space-y-2">
          {history.length ? (
            history.map((entry) => (
              <div
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
              >
                <div>
                  <p className="font-medium">
                    {entry.action.replaceAll("_", " ")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {entry.entityType} · {entry.entityId ?? "n/a"}
                  </p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{entry.actor?.name ?? "System"}</p>
                  <p>{timeAgo(entry.createdAt)}</p>
                </div>
              </div>
            ))
          ) : (
            <EmptyState title="No history" />
          )}
        </div>
      )}
    </div>
  );
}
