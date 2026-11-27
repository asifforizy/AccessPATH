import { StatGrid } from "@/components/shared/stat-grid";
import { getContributionStatistics } from "@/services/contributions";

type StatsSectionProps = {
  counts: {
    reports: number;
    contributions: number;
    reviews: number;
    favorites: number;
  };
};

export async function StatsSection({ counts }: StatsSectionProps) {
  const stats = await getContributionStatistics();

  return (
    <StatGrid
      items={[
        { label: "Reports", value: counts.reports, hint: "Submitted by you" },
        {
          label: "Contributions",
          value: stats.data?.total ?? counts.contributions,
          hint: "Total submitted",
        },
        { label: "Reviews", value: counts.reviews, hint: "Feedback written" },
        {
          label: "Favorites",
          value: counts.favorites,
          hint: "Saved locations",
        },
      ]}
    />
  );
}
