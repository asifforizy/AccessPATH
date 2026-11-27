import Link from "next/link";

import { StatusBadge } from "@/components/shared/status-badge";
import { timeAgo } from "@/lib/format";
import type { IRecentItem } from "@/utils/types";

interface ActivityListProps {
  title: string;
  href?: string;
  items: IRecentItem[];
  emptyText: string;
  /** Where a row leads, if anywhere. */
  rowHref?: (item: IRecentItem) => string;
  primary: (item: IRecentItem) => string;
  secondary?: (item: IRecentItem) => string | null;
}

export function ActivityList({
  title,
  href,
  items,
  emptyText,
  rowHref,
  primary,
  secondary,
}: ActivityListProps) {
  return (
    <section>
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        {href && (
          <Link
            href={href}
            className="text-xs font-medium text-primary hover:underline"
          >
            View all
          </Link>
        )}
      </header>

      {items.length ? (
        <ul className="mt-2 divide-y divide-border overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
          {items.map((item) => {
            const to = rowHref?.(item);
            const detail = secondary?.(item);

            const body = (
              <>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">
                    {primary(item)}
                  </span>
                  {detail && (
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                      {detail}
                    </span>
                  )}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  {item.status && <StatusBadge status={item.status} />}
                  <span className="text-[11px] text-muted-foreground">
                    {timeAgo(item.createdAt)}
                  </span>
                </span>
              </>
            );

            return (
              <li key={item.id}>
                {to ? (
                  <Link
                    href={to}
                    className="flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    {body}
                  </Link>
                ) : (
                  <div className="flex items-start justify-between gap-3 px-4 py-3">
                    {body}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="mt-2 rounded-2xl border border-dashed px-4 py-6 text-center text-xs text-muted-foreground">
          {emptyText}
        </p>
      )}
    </section>
  );
}
