import { Bell, ChevronRight, MapPin, MessageSquare } from "lucide-react";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getUnreadCount } from "@/services/notifications";

export async function QuickLinksSection() {
  const unread = await getUnreadCount();
  const unreadCount = unread.data?.unreadCount ?? 0;

  const links = [
    {
      href: "/notifications",
      icon: Bell,
      title: "Notifications",
      description: unreadCount ? `${unreadCount} unread` : "You're all caught up",
      highlight: unreadCount > 0,
    },
    {
      href: "/contribute",
      icon: MapPin,
      title: "Contribute",
      description: "Add or update location data",
      highlight: false,
    },
    {
      href: "/feedback",
      icon: MessageSquare,
      title: "Feedback",
      description: "Share your accessibility experience",
      highlight: false,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick links</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {links.map(({ href, icon: Icon, title, description, highlight }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
          >
            <span className="relative flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-4" />
              {highlight && (
                <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-destructive ring-2 ring-card" />
              )}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{title}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {description}
              </span>
            </span>
            <ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}