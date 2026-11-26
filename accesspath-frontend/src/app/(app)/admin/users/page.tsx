import { Search } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Pager } from "@/components/shared/pager";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { getAdminUsers } from "@/services/admin";

import { UserRoleForm } from "./_components/user-role-form";

type SearchParams = Promise<{
  page?: string;
  q?: string;
  role?: string;
  status?: string;
}>;

const roles = ["", "ADMIN", "MODERATOR", "CONTRIBUTOR", "USER"];
const statuses = ["", "ACTIVE", "INACTIVE", "SUSPENDED"];

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { page = "1", q = "", role = "", status = "" } = await searchParams;

  const res = await getAdminUsers({
    page: Number(page) || 1,
    limit: 20,
    q: q || undefined,
    role: role || undefined,
    status: status || undefined,
  });

  const users = res.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="User management"
        description="Change roles and account status. Admins cannot change their own account."
      >
        <Link
          href="/admin"
          className="text-sm text-muted-foreground hover:underline"
        >
          Back to admin
        </Link>
      </PageHeader>

      <form method="get" className="flex flex-wrap items-end gap-2">
        <label htmlFor="user-filter-search" className="text-xs">
          <span className="mb-1 block text-muted-foreground">Search</span>
          <Input
            id="user-filter-search"
            name="q"
            defaultValue={q}
            placeholder="Name or email"
            className="h-9 w-56"
          />
        </label>
        <label htmlFor="user-filter-role" className="text-xs">
          <span className="mb-1 block text-muted-foreground">Role</span>
          <Select
            id="user-filter-role"
            name="role"
            defaultValue={role}
            className="h-9 w-36"
          >
            {roles.map((item) => (
              <option key={item || "all"} value={item}>
                {item || "All roles"}
              </option>
            ))}
          </Select>
        </label>
        <label htmlFor="user-filter-status" className="text-xs">
          <span className="mb-1 block text-muted-foreground">Status</span>
          <Select
            id="user-filter-status"
            name="status"
            defaultValue={status}
            className="h-9 w-36"
          >
            {statuses.map((item) => (
              <option key={item || "all"} value={item}>
                {item || "All statuses"}
              </option>
            ))}
          </Select>
        </label>
        <button
          type="submit"
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-sm hover:bg-muted"
        >
          <Search aria-hidden="true" className="size-3.5" />
          Filter
        </button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
          <CardDescription>{res.meta?.total ?? 0} accounts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {users.length === 0 && (
            <p className="text-sm text-muted-foreground">No users found.</p>
          )}

          {users.map((user) => (
            <div
              key={user.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {user.email}
                </p>
                <p className="mt-1 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
                  <Badge variant="outline">Reports {user._count.reports}</Badge>
                  <Badge variant="outline">
                    Contributions {user._count.contributions}
                  </Badge>
                  <Badge variant="outline">Reviews {user._count.reviews}</Badge>
                </p>
              </div>

              <UserRoleForm
                userId={user.id}
                initialRole={user.role}
                initialStatus={user.status}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Pager
        page={res.meta?.page ?? 1}
        totalPages={res.meta?.totalPages ?? 1}
        basePath="/admin/users"
        params={{ q, role, status }}
      />
    </div>
  );
}
