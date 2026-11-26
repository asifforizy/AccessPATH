import { IMe, IRecentItem, type ProfileOverviewProps } from "@/utils/types";
import { RecentContributions } from "./recentContributions";
import { RecentReports } from "./recentReports";
import { RecentReviews } from "./recentreviews";

export function ProfileOverview({
  user,
  contributions,
  reports,
}: ProfileOverviewProps) {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <RecentContributions items={contributions} />
      <RecentReviews count={user._count.reviews} />
      <RecentReports items={reports} />
    </div>
  );
}
