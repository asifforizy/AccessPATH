import { RoutePlanner } from "./_components/route-planner";

export default function RoutesPage() {
  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100dvh-7.0625rem)] lg:min-h-0 lg:overflow-hidden">
      <header className="shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Route planner</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Choose a start and a destination by name, from your current location,
          or by tapping the map. Options are ranked on verified accessibility
          data and live barrier reports along the corridor — not distance alone.
        </p>
      </header>

      <div className="min-h-0 flex-1">
        <RoutePlanner />
      </div>
    </div>
  );
}
