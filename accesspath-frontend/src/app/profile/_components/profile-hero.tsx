import { MapPinned, Settings } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/format";
import type { IMe } from "@/utils/types";

export function ProfileHero({ user }: { user: IMe }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10">
      <div
        aria-hidden="true"
        className="h-24 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent"
      />

      <div className="px-5 pb-5 sm:px-6">
        <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            {user.image ? (
              <Image
                src={user.image}
                alt=""
                width={80}
                height={80}
                unoptimized
                className="size-20 shrink-0 rounded-full object-cover ring-4 ring-card"
              />
            ) : (
              <span
                aria-hidden="true"
                className="grid size-20 shrink-0 place-items-center rounded-full bg-primary/10 text-2xl font-semibold text-primary ring-4 ring-card"
              >
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}

            <div className="pb-1">
              <h1 className="text-2xl font-semibold tracking-tight">
                {user.name}
              </h1>
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                <Badge variant="secondary" className="capitalize">
                  {user.role.toLowerCase()}
                </Badge>
                <span className="inline-flex items-center gap-1.5 capitalize">
                  <span
                    aria-hidden="true"
                    className="size-1.5 rounded-full bg-success"
                  />
                  {user.status.toLowerCase()}
                </span>
                <span aria-hidden="true">·</span>
                <span>Member since {formatDate(user.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/preferences" />}
            >
              <Settings className="size-4" />
              Preferences
            </Button>
            <Button nativeButton={false} render={<Link href="/contribute" />}>
              <MapPinned className="size-4" />
              Contribute
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
