import { Accessibility, MapPin, PencilLine } from "lucide-react";
import type { ReactNode } from "react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import {
  contributionFacts,
  readContribution,
  typeBlurb,
  typeLabel,
} from "@/lib/contribution";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { IContribution } from "@/utils/types";

const icons: Record<string, typeof MapPin> = {
  LOCATION_CREATE: MapPin,
  LOCATION_UPDATE: PencilLine,
  ACCESSIBILITY_UPDATE: Accessibility,
};

interface ContributionRowProps {
  contribution: IContribution;
  categoryName?: string | null;
  actions?: ReactNode;
  className?: string;
}

/**
 * One submission in a list. Shows what was submitted in plain language instead
 * of the raw `proposedData` JSON.
 */
export function ContributionRow({
  contribution,
  categoryName,
  actions,
  className,
}: ContributionRowProps) {
  const model = readContribution(contribution.proposedData);
  const facts = contributionFacts(model, {
    type: contribution.type,
    categoryName,
  });
  const Icon = icons[contribution.type] ?? MapPin;

  return (
    <li
      className={cn(
        "rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40",
        className,
      )}
    >
      <div className="flex flex-wrap items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"
        >
          <Icon className="size-4.5" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold">
              {contribution.title ?? typeLabel(contribution.type)}
            </h3>
            <StatusBadge status={contribution.status} />
            <Badge variant="outline">{typeLabel(contribution.type)}</Badge>
          </div>

          <p className="mt-1 text-xs text-muted-foreground">
            {facts.length ? facts.join(" · ") : typeBlurb(contribution.type)}
          </p>

          {contribution.type !== "LOCATION_CREATE" &&
            contribution.location?.name && (
              <p className="mt-1 text-xs text-muted-foreground">
                {contribution.type === "ACCESSIBILITY_UPDATE"
                  ? "Recorded for "
                  : "Proposed for "}
                <span className="font-medium text-foreground">
                  {contribution.location.name}
                </span>
              </p>
            )}

          {contribution.description && (
            <p className="mt-2 line-clamp-2 rounded-md bg-muted/60 px-2.5 py-1.5 text-xs">
              “{contribution.description}”
            </p>
          )}

          {contribution.reviewNote && (
            <p className="mt-2 rounded-md border border-border px-2.5 py-1.5 text-xs">
              <span className="font-medium">Moderator: </span>
              {contribution.reviewNote}
            </p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <span className="text-xs text-muted-foreground">
            {timeAgo(contribution.createdAt)}
          </span>
          {model.available.length > 0 && model.unavailable.length > 0 && (
            <span className="text-[11px] text-muted-foreground">
              {model.available.length} available / {model.unavailable.length}{" "}
              missing
            </span>
          )}
          {actions}
        </div>
      </div>
    </li>
  );
}
