import { FileWarning, MapPin } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DashboardHeroProps = {
  name: string;
  role: string;
};

export function DashboardHero({ name, role }: DashboardHeroProps) {
  const firstName = name.split(" ")[0];

  return (
    <section className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/10 via-background to-background p-6 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 size-56 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Badge variant="secondary" className="capitalize">
            {role.toLowerCase()}
          </Badge>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Welcome back, {firstName}
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground">
            Track your contributions, reports, saved places, and accessibility
            preferences.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link href="/reports" className={cn(buttonVariants())}>
            <FileWarning className="size-4" />
            Report an issue
          </Link>
          <Link
            href="/contribute"
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            <MapPin className="size-4" />
            Contribute
          </Link>
        </div>
      </div>
    </section>
  );
}
