import { ProfileCard } from "./card";
import { EmptyState } from "./emptyState";

export function RecentReviews({ count }: { count: number }) {
  return (
    <ProfileCard title="Recent Reviews" href="/profile?tab=reviews">
      <EmptyState
        text={count > 0 ? `You have ${count} reviews.` : "No reviews yet."}
      />
    </ProfileCard>
  );
}
