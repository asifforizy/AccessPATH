import type { IMe } from "@/utils/types";

export function ProfileStats({ counts }: { counts: IMe["_count"] }) {
  const stats = [
    { label: "Contributions", value: counts.contributions },
    { label: "Reviews", value: counts.reviews },
    { label: "Locations", value: counts.createdLocations },
    { label: "Reports", value: counts.reports },
  ];

  return (
    <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-4">
      {stats.map((s) => (
        <div
          key={s.label}
          className="flex flex-col-reverse gap-1 bg-card px-6 py-5"
        >
          <dt className="text-xs text-muted-foreground">{s.label}</dt>
          <dd className="text-2xl font-bold tracking-tight text-foreground">
            {s.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
