import { getMyContributions } from "@/services/getmyContributions";
import { getMyReports } from "@/services/getMyReports";
import { getUserMe } from "@/services/me";
import { redirect } from "next/navigation";
import { getProfileTabs } from "./_components/tabs";
import { ProfileHeader } from "./_components/profileHeader";
import { ProfileOverview } from "./_components/profileOverview";
import { ProfileCard } from "./_components/card";
import { EmptyState } from "./_components/emptyState";

type SearchParams = Promise<{ tab?: string }>;

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { tab = "overview" } = await searchParams;

  const [user, contributions, reports] = await Promise.all([
    getUserMe(),
    getMyContributions(3),
    getMyReports(3),
  ]);

  if (!user) redirect("/login");

  const tabLabel =
    getProfileTabs(user._count).find((t) => t.key === tab)?.label ?? "Section";

  return (
    <main className="min-h-screen bg-muted">
      <ProfileHeader user={user} activeTab={tab} />

      <div className="mx-auto max-w-5xl px-6 py-6">
        {tab === "overview" ? (
          <ProfileOverview
            user={user}
            contributions={contributions}
            reports={reports}
          />
        ) : (
          <ProfileCard title={tabLabel}>
            <EmptyState text="This section isn't built yet." />
          </ProfileCard>
        )}
      </div>
    </main>
  );
}