import type { IMe } from "@/utils/types";

export function ProfileStats({ counts }: { counts: IMe["_count"] }) {
  const stats = [
    { label: "Contributions", value: counts.contributions },
    { label: "Reviews", value: counts.reviews },
    { label: "Places added", value: counts.createdLocations },
    { label: "Reports", value: counts.reports },
  ];

  return (
    <dl className="grid min-w-0 grid-cols-2 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="border-border px-5 py-4 not-first:border-l [&:nth-child(3)]:border-l-0 [&:nth-child(n+3)]:border-t sm:[&:nth-child(n+3)]:border-t-0 sm:[&:nth-child(3)]:border-l"
        >
          <dd className="text-2xl font-semibold tracking-tight tabular-nums">
            {stat.value}
          </dd>
          <dt className="mt-0.5 text-xs text-muted-foreground">{stat.label}</dt>
        </div>
      ))}
    </dl>
  );
}
