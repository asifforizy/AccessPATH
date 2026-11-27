import { formatDate } from "@/lib/format";
import type { IMe } from "@/utils/types";

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5 text-sm">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-right">{children}</dd>
    </div>
  );
}

export function AccountCard({ user }: { user: IMe }) {
  return (
    <section className="min-w-0 rounded-2xl bg-card ring-1 ring-foreground/10">
      <header className="border-b border-border px-5 py-3">
        <h2 className="text-sm font-semibold">Account</h2>
      </header>

      <dl className="divide-y divide-border px-5">
        <Row label="Email">
          <span className="block truncate" title={user.email}>
            {user.email}
          </span>
          {user.emailVerifiedAt ? (
            <span className="text-xs text-success">Verified</span>
          ) : (
            <span className="text-xs text-muted-foreground">Unverified</span>
          )}
        </Row>
        <Row label="Role">
          <span className="capitalize">{user.role.toLowerCase()}</span>
        </Row>
        <Row label="Status">
          <span className="capitalize">{user.status.toLowerCase()}</span>
        </Row>
        <Row label="Joined">{formatDate(user.createdAt)}</Row>
        <Row label="Last updated">{formatDate(user.updatedAt)}</Row>
      </dl>
    </section>
  );
}
