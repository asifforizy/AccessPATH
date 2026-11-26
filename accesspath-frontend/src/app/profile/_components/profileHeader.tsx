import { formatDate } from "@/lib/format";
import { IMe, type ProfileHeaderProps } from "@/utils/types";
import { UserAvatar } from "./avatar";
import { ProfileDetails } from "./details";
import { ProfileStats } from "./stats";
import { ProfileTabs } from "./tabs";

export function ProfileHeader({ user, activeTab }: ProfileHeaderProps) {
  return (
    <header>
      {/* Banner */}
      <div className="relative h-32 overflow-hidden border-b border-border bg-gradient-to-br from-primary/20 via-primary/5 to-transparent">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl px-6">
        {/* Avatar protruding from the banner */}
        <div className="relative -mt-16 z-10 inline-block">
          <div className="overflow-hidden rounded-2xl shadow-xl ring-4 ring-background">
            <UserAvatar name={user.name} image={user.image} />
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Identity */}
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {user.name}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Member since {formatDate(user.createdAt)}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                {user.role}
              </span>
              <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
                {user.status}
              </span>
            </div>
          </div>

          {/* Details card */}
          <div className="shrink-0 rounded-xl border border-border bg-card p-4 shadow-sm md:min-w-[280px]">
            <ProfileDetails user={user} />
          </div>
        </div>

        <ProfileStats counts={user._count} />

        <ProfileTabs counts={user._count} activeTab={activeTab} />
      </div>
    </header>
  );
}
