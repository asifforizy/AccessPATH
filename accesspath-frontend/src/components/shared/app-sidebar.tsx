"use client";

import {
  Activity,
  BarChart3,
  Bell,
  Bookmark,
  Compass,
  FileWarning,
  LayoutDashboard,
  type LucideIcon,
  MapPin,
  MapPinned,
  MessageSquare,
  Route,
  ShieldCheck,
  SlidersHorizontal,
  Upload,
  User,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface AppSidebarProps {
  role: string;
}

const links: {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: string[];
  /** Only highlight on an exact path (for parents with nested pages). */
  exact?: boolean;
}[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/explore",
    label: "Explore",
    icon: Compass,
    exact: true,
  },
  { href: "/explore/map", label: "Map explorer", icon: MapPinned },
  { href: "/routes", label: "Route Planner", icon: Route },
  { href: "/reports", label: "Reports", icon: FileWarning },
  { href: "/contribute", label: "Contribute", icon: MapPin },
  { href: "/favorites", label: "Favorites", icon: Bookmark },
  { href: "/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/uploads", label: "Uploads", icon: Upload },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/preferences", label: "Preferences", icon: SlidersHorizontal },
  {
    href: "/moderation",
    label: "Moderation",
    icon: ShieldCheck,
    roles: ["ADMIN", "MODERATOR"],
  },
  {
    href: "/analytics",
    label: "Analytics",
    icon: BarChart3,
    roles: ["ADMIN", "MODERATOR"],
  },
  { href: "/admin", label: "Admin", icon: Activity, roles: ["ADMIN"] },
  { href: "/profile", label: "Profile", icon: User },
];

export function AppSidebar({ role }: AppSidebarProps) {
  const pathname = usePathname();

  const visible = links.filter(
    (link) => !link.roles || link.roles.includes(role),
  );

  const isActive = (link: { href: string; exact?: boolean }) =>
    link.exact
      ? pathname === link.href
      : pathname === link.href || pathname.startsWith(`${link.href}/`);

  return (
    <>
      <aside className="hidden w-56 shrink-0 lg:block">
        <nav className="sticky top-24 flex flex-col gap-1 rounded-xl border bg-card p-2">
          <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Workspace
          </p>

          {visible.map((link) => {
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                  isActive(link)
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="-mx-4 mb-4 overflow-x-auto px-4 lg:hidden">
        <nav className="flex w-max gap-1 rounded-xl border bg-card p-1.5">
          {visible.map((link) => {
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs whitespace-nowrap",
                  isActive(link)
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Icon className="size-3.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
