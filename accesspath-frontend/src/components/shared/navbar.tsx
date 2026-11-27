"use client";

import {
  Accessibility,
  Activity,
  BarChart3,
  Bell,
  Bookmark,
  ChevronDown,
  Compass,
  FileWarning,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  type LucideIcon,
  Map as MapIcon,
  MapPin,
  MapPinned,
  Menu,
  MessageSquare,
  Route,
  ShieldCheck,
  SlidersHorizontal,
  Tags,
  Upload,
  User,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import Logo from "@/assets/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { logout } from "@/services/logout";

import { ModeToggle } from "./mode-toggle";

type UserRole = "ADMIN" | "MODERATOR" | "CONTRIBUTOR" | "USER";

interface NavbarUser {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: UserRole;
}

interface NavbarProps {
  user: NavbarUser | null;
}

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: UserRole[];
  exact?: boolean;
}

const primaryLinks: NavLink[] = [
  { href: "/", label: "Home", icon: Accessibility, exact: true },
  { href: "/explore", label: "Explore", icon: Compass, exact: true },
  { href: "/explore/map", label: "Map", icon: MapIcon },
  { href: "/routes", label: "Routes", icon: Route },
  { href: "/contribute", label: "Contribute", icon: MapPin },
  { href: "/services", label: "Services", icon: Layers },
];

const workspaceLinks: NavLink[] = [
  { href: "/reports", label: "Reports", icon: FileWarning },
  { href: "/favorites", label: "Favorites", icon: Bookmark },
  { href: "/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/uploads", label: "Uploads", icon: Upload },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/preferences", label: "Preferences", icon: SlidersHorizontal },
];

/** Administration: platform data and the tools that keep it clean. */
const adminLinks: NavLink[] = [
  {
    href: "/admin",
    label: "Admin overview",
    icon: Activity,
    exact: true,
    roles: ["ADMIN"],
  },
  { href: "/admin/users", label: "Users", icon: Users, roles: ["ADMIN"] },
  {
    href: "/admin/locations",
    label: "Locations",
    icon: MapPinned,
    roles: ["ADMIN"],
  },
  {
    href: "/admin/categories",
    label: "Categories",
    icon: Tags,
    roles: ["ADMIN"],
  },
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
];

function getDashboardHref(role?: UserRole) {
  if (role === "ADMIN") return "/admin/dashboard";
  if (role === "MODERATOR") return "/moderator/dashboard";
  if (role === "CONTRIBUTOR") return "/contributor/dashboard";
  return "/dashboard";
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const dashboardHref = getDashboardHref(user?.role);

  const canSee = (link: NavLink) =>
    !link.roles || (user ? link.roles.includes(user.role) : false);

  const visibleWorkspace = workspaceLinks.filter(canSee);
  const visibleAdmin = adminLinks.filter(canSee);

  const isActive = (item: { href: string; exact?: boolean }) => {
    const { href, exact } = item;

    if (href.includes("#")) return false;
    if (href === "/") return pathname === "/";
    if (exact) return pathname === href;

    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      await logout();
      toast.success("Logged out successfully!");
      setMobileOpen(false);
      window.location.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Failed to logout. Please try again.");
      setIsLoggingOut(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center">
          {/* LEFT: Mobile menu + Brand */}
          <div className="flex flex-1 items-center gap-3">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <button
                    type="button"
                    className="flex size-9 items-center justify-center rounded-md hover:bg-muted lg:hidden"
                    aria-label="Open navigation menu"
                  />
                }
              >
                <Menu className="size-5" />
              </SheetTrigger>

              <SheetContent side="left" className="w-80 gap-0">
                <SheetHeader className="border-b">
                  <SheetTitle>
                    <Link
                      href="/"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 text-xl font-bold tracking-tight"
                    >
                      <Logo size={24} title="AccessPath" />
                      <span>
                        Access<span className="text-primary">Path</span>
                      </span>
                    </Link>
                  </SheetTitle>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-3">
                  <p className="px-3 pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Navigation
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {primaryLinks.map((item) => {
                      const Icon = item.icon;
                      return (
                        <SheetClose
                          key={item.href}
                          render={<Link href={item.href} />}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                            isActive(item)
                              ? "bg-primary/10 font-semibold text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          <Icon className="size-4" />
                          {item.label}
                        </SheetClose>
                      );
                    })}
                  </div>

                  {user && (
                    <>
                      <div className="my-3 h-px bg-border" />
                      <p className="px-3 pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Workspace
                      </p>
                      <div className="flex flex-col gap-0.5">
                        <SheetClose
                          render={<Link href={dashboardHref} />}
                          className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <LayoutDashboard className="size-4" />
                          Dashboard
                        </SheetClose>

                        {visibleWorkspace.map((item) => {
                          const Icon = item.icon;
                          return (
                            <SheetClose
                              key={item.href}
                              render={<Link href={item.href} />}
                              className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                                isActive(item)
                                  ? "bg-primary/10 font-semibold text-primary"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                              )}
                            >
                              <Icon className="size-4" />
                              {item.label}
                            </SheetClose>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {visibleAdmin.length > 0 && (
                    <>
                      <div className="my-3 h-px bg-border" />
                      <p className="px-3 pb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Administration
                      </p>
                      <div className="flex flex-col gap-0.5">
                        {visibleAdmin.map((item) => {
                          const Icon = item.icon;
                          return (
                            <SheetClose
                              key={item.href}
                              render={<Link href={item.href} />}
                              className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                                isActive(item)
                                  ? "bg-primary/10 font-semibold text-primary"
                                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                              )}
                            >
                              <Icon className="size-4" />
                              {item.label}
                            </SheetClose>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                <div className="border-t p-3">
                  {user ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 px-2">
                        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {user.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {user.email}
                          </p>
                        </div>
                      </div>

                      <SheetClose
                        render={<Link href="/profile" />}
                        className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <User className="size-4" />
                        Profile
                      </SheetClose>

                      <button
                        type="button"
                        onClick={handleLogout}
                        disabled={isLoggingOut}
                        className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/40"
                      >
                        <LogOut className="size-4" />
                        {isLoggingOut ? "Logging out..." : "Logout"}
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <SheetClose
                        render={<Link href="/login" />}
                        className="flex items-center justify-center rounded-md border px-3 py-2 text-sm font-medium"
                      >
                        Login
                      </SheetClose>

                      <SheetClose
                        render={<Link href="/register" />}
                        className="flex items-center justify-center rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
                      >
                        Get Started
                      </SheetClose>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            {/* Brand */}
            <Link
              href="/"
              aria-label="AccessPath home"
              className="flex items-center gap-2 text-xl font-bold tracking-tight"
            >
              <Logo size={26} title="" />
              <span>
                Access<span className="text-primary">Path</span>
              </span>
            </Link>
          </div>

          {/* CENTER: Desktop navigation */}
          <div className="hidden flex-1 items-center justify-center gap-1 lg:flex">
            {primaryLinks.map((item) => {
              const active = isActive(item);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative rounded-md px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* RIGHT: Workspace + Theme + Authentication */}
          <div className="flex flex-1 items-center justify-end gap-2">
            {user && (
              <div className="hidden sm:block">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <button
                        type="button"
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background px-3 text-sm font-medium transition-colors hover:bg-muted"
                      />
                    }
                  >
                    <LayoutGrid className="size-4" />
                    Workspace
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  </DropdownMenuTrigger>

                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuGroup>
                      <DropdownMenuLabel>Workspace</DropdownMenuLabel>

                      <DropdownMenuItem
                        render={<Link href={dashboardHref} />}
                        className="flex cursor-pointer items-center gap-2"
                      >
                        <LayoutDashboard className="size-4" />
                        Dashboard
                      </DropdownMenuItem>

                      {visibleWorkspace.map((item) => {
                        const Icon = item.icon;
                        return (
                          <DropdownMenuItem
                            key={item.href}
                            render={<Link href={item.href} />}
                            className="flex cursor-pointer items-center gap-2"
                          >
                            <Icon className="size-4" />
                            {item.label}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuGroup>

                    {visibleAdmin.length > 0 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                          <DropdownMenuLabel>Administration</DropdownMenuLabel>
                          {visibleAdmin.map((item) => {
                            const Icon = item.icon;
                            return (
                              <DropdownMenuItem
                                key={item.href}
                                render={<Link href={item.href} />}
                                className="flex cursor-pointer items-center gap-2"
                              >
                                <Icon className="size-4" />
                                {item.label}
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuGroup>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            <ModeToggle />

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <button
                      type="button"
                      aria-label="Open user menu"
                      className="flex size-9 items-center justify-center rounded-full border bg-muted transition-colors hover:bg-accent"
                    />
                  }
                >
                  <User className="size-5" />
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-60">
                  <div className="px-3 py-2">
                    <p className="truncate text-sm font-semibold">
                      {user.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user.email}
                    </p>
                    <p className="mt-1 text-xs font-medium text-primary">
                      {user.role}
                    </p>
                  </div>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    render={<Link href="/profile" />}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <User className="size-4" />
                    Profile
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    render={<Link href={dashboardHref} />}
                    className="flex cursor-pointer items-center gap-2"
                  >
                    <LayoutDashboard className="size-4" />
                    Dashboard
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex cursor-pointer items-center gap-2 text-red-600 focus:text-red-600"
                  >
                    <LogOut className="size-4" />
                    {isLoggingOut ? "Logging out..." : "Logout"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  className="hidden sm:inline-flex"
                  nativeButton={false}
                  render={<Link href="/login" />}
                >
                  Login
                </Button>

                <Button nativeButton={false} render={<Link href="/register" />}>
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
