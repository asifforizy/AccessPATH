import { PageHeader } from "@/components/shared/page-header";

import { RoutePlanner } from "./_components/route-planner";

export default function RoutesPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Route planner"
        description="Plan accessible routes, compare alternatives, inspect barriers, and score accessibility."
      />
      <RoutePlanner />
    </div>
  );
}
