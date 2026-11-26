import { Bell } from "lucide-react";

import { ActionButton } from "@/components/shared/action-button";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { timeAgo } from "@/lib/format";
import {
  clearNotifications,
  deleteNotification,
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications";

export default async function NotificationsPage() {
  const [notifications, unread] = await Promise.all([
    getNotifications({ limit: 50 }),
    getUnreadCount(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description={`${unread.data?.unreadCount ?? 0} unread notification(s).`}
      >
        <ActionButton
          action={markAllNotificationsRead}
          label="Mark all read"
          variant="outline"
        />
        <ActionButton
          action={clearNotifications}
          label="Clear all"
          variant="destructive"
          confirm="Delete every notification?"
        />
      </PageHeader>

      {notifications.data?.length ? (
        <div className="space-y-3">
          {notifications.data.map((notification) => (
            <Card key={notification.id} size="sm">
              <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex gap-3">
                  <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Bell className="size-4" />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold">
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <Badge variant="warning">New</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {notification.type.replaceAll("_", " ")} ·{" "}
                      {timeAgo(notification.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 gap-2">
                  {!notification.isRead && (
                    <ActionButton
                      action={markNotificationRead.bind(null, notification.id)}
                      label="Mark read"
                      size="xs"
                    />
                  )}
                  <ActionButton
                    action={deleteNotification.bind(null, notification.id)}
                    label="Delete"
                    variant="destructive"
                    size="xs"
                    confirm="Delete this notification?"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="No notifications"
          description="Updates about your reports and contributions will appear here."
        />
      )}
    </div>
  );
}

// Every surface here is cookie-authenticated and dynamic; allow blocking render.
export const instant = false;
