
import { List } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { MapExplorer } from "@/components/map/map-explorer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Map explorer · AccessPath",
  description:
    "Explore accessible places on an interactive map: filter by accessibility features, search nearby, and check verification status.",
};

export default function ExploreMapPage() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Map explore
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Browse verified accessibility information on the map. Unknown
            accessibility data is shown as unknown — never as confirmed
            accessible.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          nativeButton={false}
          render={<Link href="/explore" />}
        >
          <List aria-hidden="true" className="size-3.5" />
          List view
        </Button>
      </div>

      <div className="min-h-0 flex-1">
        <MapExplorer />
      </div>
    </div>
  );
}
