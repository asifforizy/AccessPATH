import type { ReactNode } from "react";

import { Card, CardContent } from "@/components/ui/card";

interface StatItem {
  label: string;
  value: ReactNode;
  hint?: string;
}

export function StatGrid({ items }: { items: StatItem[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} size="sm">
          <CardContent>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {item.label}
            </p>
            <p className="mt-1 text-2xl font-bold">{item.value}</p>
            {item.hint && (
              <p className="mt-0.5 text-xs text-muted-foreground">
                {item.hint}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
