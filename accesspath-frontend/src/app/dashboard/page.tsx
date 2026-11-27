import { redirect } from "next/navigation";
import { Suspense } from "react";

import { DashboardHero } from "@/components/dashboard/dashboard-hero";
import {
  CardSkeleton,
  QuickLinksSkeleton,
  StatsSkeleton,
} from "@/components/dashboard/dashboard-skeletons";
import { QuickLinksSection } from "@/components/dashboard/quick-link-section";
import { RecentReportsSection } from "@/components/dashboard/recent-reports-section";
import { SavedPlacesSection } from "@/components/dashboard/saved-places-section";
import { StatsSection } from "@/components/dashboard/status-section";
import { getUserMe } from "@/services/me";

export default async function DashboardPage() {
  const user = await getUserMe();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <DashboardHero name={user.name} role={user.role} />

      <Suspense fallback={<StatsSkeleton />}>
        <StatsSection counts={user._count} />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Suspense fallback={<CardSkeleton rows={3} />}>
            <RecentReportsSection />
          </Suspense>
        </div>

        <aside className="space-y-6">
          <Suspense fallback={<CardSkeleton rows={4} />}>
            <SavedPlacesSection />
          </Suspense>
          <Suspense fallback={<QuickLinksSkeleton />}>
            <QuickLinksSection />
          </Suspense>
        </aside>
      </div>
    </div>
  );
}

// Every surface here is cookie-authenticated and dynamic; allow blocking render.
export const instant = false;
