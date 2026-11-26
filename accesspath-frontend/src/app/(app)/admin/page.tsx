import { redirect } from "next/navigation";

import { ActionButton } from "@/components/shared/action-button";
import { PageHeader } from "@/components/shared/page-header";
import { StatGrid } from "@/components/shared/stat-grid";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { timeAgo } from "@/lib/format";
import {
  clearAdminCache,
  getAdminSettings,
  getAdminStats,
  getAuditLogs,
  getHealth,
  getVersion,
} from "@/services/admin";
import { getUserMe } from "@/services/me";

import { AdminSettingsForm } from "./_components/admin-settings-form";

export default async function AdminPage() {
  const user = await getUserMe();

  if (!user) redirect("/login");

  if (user.role !== "ADMIN") redirect("/dashboard");

  const [stats, settings, logs, health, version] = await Promise.all([
    getAdminStats(),
    getAdminSettings(),
    getAuditLogs({ limit: 25 }),
    getHealth(),
    getVersion(),
  ]);

  const data = stats.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin"
        description="Platform health, settings, and audit activity."
      >
        <Badge
          variant={health.data?.status === "ok" ? "success" : "destructive"}
        >
          {health.data?.status ?? "unknown"}
        </Badge>
        <ActionButton
          action={clearAdminCache}
          label="Clear cache"
          variant="outline"
          confirm="Clear the application cache?"
        />
      </PageHeader>

      <StatGrid
        items={[
          { label: "Users", value: data?.users ?? 0 },
          { label: "Locations", value: data?.locations ?? 0 },
          { label: "Reports", value: data?.reports ?? 0 },
          { label: "Contributions", value: data?.contributions ?? 0 },
          { label: "Reviews", value: data?.reviews ?? 0 },
          { label: "Favorites", value: data?.favorites ?? 0 },
          { label: "Notifications", value: data?.notifications ?? 0 },
          { label: "Audit logs", value: data?.auditLogs ?? 0 },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Changes are stored in memory by the backend and reset on restart.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AdminSettingsForm
              settings={
                settings.data ?? {
                  siteName: "AccessPath",
                  supportEmail: "support@accesspath.app",
                  maintenanceMode: false,
                  allowRegistrations: true,
                  defaultPageSize: 20,
                  maxUploadSizeMb: 10,
                  features: {},
                }
              }
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System</CardTitle>
              <CardDescription>Runtime and API information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>Status: {health.data?.status ?? "unknown"}</p>
              <p>Database: {health.data?.database ?? "unknown"}</p>
              <p>Environment: {health.data?.environment ?? "unknown"}</p>
              <p>
                Uptime: {Math.floor((health.data?.uptimeSeconds ?? 0) / 60)} min
              </p>
              <p>API version: {version.data?.apiVersion ?? "n/a"}</p>
              <p>Node: {version.data?.nodeVersion ?? "n/a"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Pending moderation</CardTitle>
              <CardDescription>Work waiting for review.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p>Locations: {data?.pending.locations ?? 0}</p>
              <p>Reports: {data?.pending.reports ?? 0}</p>
              <p>Contributions: {data?.pending.contributions ?? 0}</p>
              <p>Total: {data?.pending.total ?? 0}</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent audit logs</CardTitle>
          <CardDescription>Latest 25 system events.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-125 text-left text-xs">
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-2">Action</th>
                <th>Entity</th>
                <th>Actor</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {logs.data?.map((log) => (
                <tr key={log.id} className="border-t">
                  <td className="py-1.5 font-medium">
                    {log.action.replaceAll("_", " ")}
                  </td>
                  <td>
                    {log.entityType} · {log.entityId ?? "n/a"}
                  </td>
                  <td>{log.actor?.name ?? "System"}</td>
                  <td>{timeAgo(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// Every surface here is cookie-authenticated and dynamic; allow blocking render.
export const instant = false;
