import { redirect } from "next/navigation";

import { PageHeader } from "@/components/shared/page-header";
import { StatGrid } from "@/components/shared/stat-grid";
import { getUserMe } from "@/services/me";
import {
  getModerationContributions,
  getModerationFeedback,
  getModerationHistory,
  getModerationLocations,
  getModerationReports,
  getModerationStatistics,
} from "@/services/moderation";

import { ModerationPanel } from "./_components/moderation-panel";

export default async function ModerationPage() {
  const user = await getUserMe();

  if (!user) redirect("/login");

  if (user.role !== "ADMIN" && user.role !== "MODERATOR") {
    redirect("/dashboard");
  }

  const [locations, reports, contributions, feedback, history, statistics] =
    await Promise.all([
      getModerationLocations({ limit: 20 }),
      getModerationReports({ limit: 20 }),
      getModerationContributions({ limit: 20 }),
      getModerationFeedback({ limit: 20 }),
      getModerationHistory({ limit: 20 }),
      getModerationStatistics(),
    ]);

  const stats = statistics.data;

  const pendingLocations = stats?.locations.byStatus.PENDING ?? 0;
  const pendingReports = stats?.reports.byStatus.PENDING ?? 0;
  const pendingContributions = stats?.contributions.byStatus.PENDING ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Moderation"
        description="Review pending locations, reports, contributions, and feedback."
      />

      <StatGrid
        items={[
          { label: "Pending locations", value: pendingLocations },
          { label: "Pending reports", value: pendingReports },
          { label: "Pending contributions", value: pendingContributions },
          {
            label: "Total pending",
            value: pendingLocations + pendingReports + pendingContributions,
          },
        ]}
      />

      <ModerationPanel
        locations={locations.data ?? []}
        reports={reports.data ?? []}
        contributions={contributions.data ?? []}
        feedback={feedback.data ?? []}
        history={history.data ?? []}
      />
    </div>
  );
}

// Every surface here is cookie-authenticated and dynamic; allow blocking render.
export const instant = false;
