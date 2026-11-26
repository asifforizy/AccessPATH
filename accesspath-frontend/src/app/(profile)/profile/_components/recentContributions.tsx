import { timeAgo } from "@/lib/format";
import type { IRecentItem } from "@/utils/types";
import { ProfileCard } from "./card";
import { EmptyState } from "./emptyState";

export function RecentContributions({ items }: { items: IRecentItem[] }) {
  return (
    <ProfileCard title="Recent contributions" href="/profile?tab=contributions">
      <div className="mb-4 flex h-32 items-center justify-center rounded-lg border border-border bg-gradient-to-br from-muted to-muted/40 text-xs font-medium text-muted-foreground">
        Map preview
      </div>

      {items.length === 0 ? (
        <EmptyState text="No contributions yet." />
      ) : (
        <ul className="-mx-2 space-y-1">
          {items.map((c) => (
            <li
              key={c.id}
              className="rounded-lg px-2 py-2 transition-colors hover:bg-muted/50"
            >
              <p className="font-medium text-foreground">
                {c.location?.name ?? "Unknown location"}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {c.status ? `${c.status} · ` : ""}
                {timeAgo(c.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </ProfileCard>
  );
}
