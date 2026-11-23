import { IMe } from "@/utils/types";
import Link from "next/link";

export const getProfileTabs = (counts: IMe["_count"]) => [
  { key: "overview", label: "Overview" },
  { key: "contributions", label: "Contributions", count: counts.contributions },
  { key: "reviews", label: "Reviews", count: counts.reviews },
  { key: "locations", label: "Locations", count: counts.createdLocations },
  { key: "reports", label: "Reports", count: counts.reports },
  { key: "favorites", label: "Favorites", count: counts.favorites },
  { key: "settings", label: "Settings" },
];

interface ProfileTabsProps {
  counts: IMe["_count"];
  activeTab: string;
}

export function ProfileTabs({ counts, activeTab }: ProfileTabsProps) {
  return (
    <nav
      className="mt-8 flex gap-1 overflow-x-auto border-b border-border"
      aria-label="Profile sections"
    >
      {getProfileTabs(counts).map((t) => {
        const active = activeTab === t.key;
        return (
          <Link
            key={t.key}
            href={`/profile?tab=${t.key}`}
            aria-current={active ? "page" : undefined}
            className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-t-lg px-3 py-3 text-sm transition-colors ${
              active
                ? "text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <span className={active ? "font-semibold" : "font-medium"}>
              {t.label}
            </span>
            {t.count !== undefined && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  active
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {t.count}
              </span>
            )}
            {active && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-primary" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}