import { IMe, IRecentItem, ProfileOverviewProps } from "@/utils/types";
import { RecentContributions } from "./recentContributions";
import { RecentReviews } from "./recentreviews";
import { RecentReports } from "./recentReports";


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