import { formatDate } from "@/lib/format";
import type { IMe } from "@/utils/types";

export function ProfileDetails({ user }: { user: IMe }) {
  return (
    <dl className="space-y-3 text-sm">
      <div>
        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Email
        </dt>
        <dd className="mt-0.5 flex items-center gap-2 text-foreground">
          <span className="truncate">{user.email}</span>
          {user.emailVerifiedAt && (
            <span className="shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium text-success">
              Verified
            </span>
          )}
        </dd>
      </div>

      <div>
        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Joined
        </dt>
        <dd className="mt-0.5 text-foreground">{formatDate(user.createdAt)}</dd>
      </div>

      <div>
        <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          Last updated
        </dt>
        <dd className="mt-0.5 text-foreground">{formatDate(user.updatedAt)}</dd>
      </div>
    </dl>
  );
}
