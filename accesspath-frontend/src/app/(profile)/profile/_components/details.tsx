import { formatDate } from "@/lib/format";
import { IMe } from "@/utils/types";

export function ProfileDetails({ user }: { user: IMe }) {
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-xs md:min-w-[260px]">
      <dt className="text-muted-foreground">Email:</dt>
      <dd className="text-foreground">
        <span className="block">{user.email}</span>
        {user.emailVerifiedAt && (
          <span className="text-success">Verified</span>
        )}
      </dd>

      <dt className="text-muted-foreground">Joined:</dt>
      <dd className="text-foreground">{formatDate(user.createdAt)}</dd>

      <dt className="text-muted-foreground">Last Updated:</dt>
      <dd className="text-foreground">{formatDate(user.updatedAt)}</dd>
    </dl>
  );
}