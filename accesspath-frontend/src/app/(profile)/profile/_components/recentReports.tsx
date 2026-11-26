import { timeAgo } from "@/lib/format";
import type { IRecentItem } from "@/utils/types";
import { ProfileCard } from "./card";
import { EmptyState } from "./emptyState";

export function RecentReports({ items }: { items: IRecentItem[] }) {
  return (
    <ProfileCard title="Recent reports" href="/profile?tab=reports">
      {items.length === 0 ? (
        <EmptyState text="No reports yet." />
      ) : (
        <ul className="-mx-2 space-y-1">
          {items.map((r) => (
            <li
              key={r.id}
              className="flex items-start justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-foreground">
                  {r.location?.name ?? "Unknown location"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.description ?? r.type ?? r.status}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground/70">
                {timeAgo(r.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ProfileCard>
  );
}
