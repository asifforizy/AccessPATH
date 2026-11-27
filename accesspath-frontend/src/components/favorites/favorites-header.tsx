import { Compass } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export function FavoritesHeader({ total }: { total: number }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Favorites</h1>
        <p className="text-sm text-muted-foreground">
          Places you saved to revisit quickly.
          <span className="ml-1 font-medium text-foreground">
            {total} saved
          </span>
        </p>
      </div>

      <Link href="/explore" className={buttonVariants({ variant: "outline" })}>
        <Compass className="size-4" />
        Explore more
      </Link>
    </header>
  );
}
