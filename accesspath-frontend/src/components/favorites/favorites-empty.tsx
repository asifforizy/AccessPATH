import { Bookmark } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";

export function FavoritesEmpty() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed px-6 py-14 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Bookmark className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="font-semibold">No favorites yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Browse the explore page and save accessible places you want to come
          back to.
        </p>
      </div>
      <Link href="/explore" className={buttonVariants()}>
        Explore locations
      </Link>
    </div>
  );
}