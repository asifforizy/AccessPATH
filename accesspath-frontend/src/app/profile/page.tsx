import { redirect } from "next/navigation";

import { getMyReports } from "@/services/getMyReports";
import { getMyContributions } from "@/services/getmyContributions";
import { getUserMe } from "@/services/me";
import { AccountCard } from "./_components/account-card";
import { ActivityList } from "./_components/activity-list";
import { ProfileHero } from "./_components/profile-hero";
import { ProfileStats } from "./_components/profile-stats";

export default async function ProfilePage() {
  const [user, contributions, reports] = await Promise.all([
    getUserMe(),
    getMyContributions(4),
    getMyReports(4),
  ]);

  if (!user) redirect("/login");

  return (
    <div className="space-y-5 ">
      <ProfileHero user={user} />

      <ProfileStats counts={user._count} />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-start">
        <div className="min-w-0 space-y-6">
          <ActivityList
            title="Contributions"
            href="/contribute#my-contributions"
            items={contributions}
            emptyText="Nothing submitted yet. Add a place or correct a detail to get started."
            rowHref={(item) => `/contributions/${item.id}`}
            primary={(item) =>
              item.title ?? item.location?.name ?? "Untitled submission"
            }
            secondary={(item) => item.description ?? null}
          />

          <ActivityList
            title="Reports"
            href="/reports"
            items={reports}
            emptyText="No issue reports yet. Tell us about a blocked ramp or a broken lift."
            rowHref={(item) => `/reports/${item.id}`}
            primary={(item) => item.location?.name ?? "Removed place"}
            secondary={(item) => item.description ?? null}
          />
        </div>

        <AccountCard user={user} />
      </div>
    </div>
  );
}

// Every surface here is cookie-authenticated and dynamic; allow blocking render.
export const instant = false;
