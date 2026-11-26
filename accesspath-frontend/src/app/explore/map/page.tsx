import { List, MapPinned } from "lucide-react";
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
    /**
     * The map workspace owns the viewport height below the navbar so the map and
     * the result list can never stretch the document:
     *   4.0625rem = sticky navbar (h-16 + border)
     *   3rem     = vertical padding of <main> in (app)/layout.tsx
     * A definite height is what lets MapLibre measure its container instead of
     * fighting it in a resize loop.
     */
    <div className="flex h-[calc(100dvh-7.0625rem)] flex-col gap-3">
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"
          >
            <MapPinned className="size-4.5" />
          </span>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight">
              Map explorer
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              Verified accessibility on the map — places without data stay
              unknown, never “confirmed accessible”.
            </p>
          </div>
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
      </header>

      <div className="min-h-0 flex-1">
        <MapExplorer />
      </div>
    </div>
  );
}
