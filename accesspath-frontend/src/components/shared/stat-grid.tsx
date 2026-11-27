import { ArrowUpRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatItem {
  label: string;
  value: ReactNode;
  hint?: string;
  /** When set, the whole card becomes a link to this route. */
  href?: string;
  icon?: LucideIcon;
}

export function StatGrid({ items }: { items: StatItem[] }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-3 md:grid-cols-3",
        items.length === 3 ? "xl:grid-cols-3" : "xl:grid-cols-4",
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;

        const card = (
          <Card
            size="sm"
            className={cn(
              "h-full",
              item.href &&
                "transition-colors group-hover/stat:bg-muted/50 group-hover/stat:ring-primary/30",
            )}
          >
            <CardContent>
              <div className="flex items-start justify-between gap-2">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {item.label}
                </p>
                <span className="flex items-center gap-1 text-muted-foreground">
                  {Icon ? (
                    <Icon
                      aria-hidden="true"
                      className={cn(
                        "size-4",
                        item.href && "group-hover/stat:text-primary",
                      )}
                    />
                  ) : null}
                  {item.href ? (
                    <ArrowUpRight
                      aria-hidden="true"
                      className="size-3.5 opacity-60 group-hover/stat:opacity-100 group-hover/stat:text-primary"
                    />
                  ) : null}
                </span>
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">
                {item.value}
              </p>
              {item.hint && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.hint}
                </p>
              )}
            </CardContent>
          </Card>
        );

        if (!item.href) {
          return <div key={item.label}>{card}</div>;
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            className="group/stat block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {card}
          </Link>
        );
      })}
    </div>
  );
}
