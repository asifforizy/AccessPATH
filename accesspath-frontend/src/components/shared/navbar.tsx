
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    Accessibility,
    Compass,
    LayoutDashboard,
    LogOut,
    Map,
    Menu,
    Route,
    User,
    Users,
} from 'lucide-react'
import { toast } from 'sonner'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet'

import { Button } from '@/components/ui/button'
import { logout } from '@/services/logout'
import { ModeToggle } from './mode-toggle'
import Logo from '@/assets/logo'


type UserRole = 'ADMIN' | 'MODERATOR' | 'CONTRIBUTOR' | 'USER'

interface NavbarUser {
    id: string
    name: string
    email: string
    image?: string | null
    role: UserRole
}

interface NavbarProps {
    user: NavbarUser | null
}

const navItems = [
    {
        label: 'Home',
        href: '/',
        icon: Accessibility,
    },
    {
        label: 'Explore',
        href: '/explore',
        icon: Compass,
    },
    {
        label: 'Map',
        href: '/map',
        icon: Map,
    },
    {
        label: 'Route Planner',
        href: '/routes',
        icon: Route,
    },
    {
        label: 'Contribute',
        href: '/contribute',
        icon: Users,
    },
    {
        label: 'About',
        href: '/about',
        icon: User,
    },
]

export function Navbar({ user }: NavbarProps) {
    const pathname = usePathname()

    const [mobileOpen, setMobileOpen] = useState(false)
    const [isLoggingOut, setIsLoggingOut] = useState(false)

    const dashboardHref =
        user?.role === 'ADMIN'
            ? '/admin/dashboard'
            : user?.role === 'MODERATOR'
                ? '/moderator/dashboard'
                : user?.role === 'CONTRIBUTOR'
                    ? '/contributor/dashboard'
                    : '/dashboard'

    const isActive = (href: string) =>
        href === '/'
            ? pathname === '/'
            : pathname === href || pathname.startsWith(`${href}/`)

    const handleLogout = async () => {
        if (isLoggingOut) return

        try {
            setIsLoggingOut(true)

            await logout()

            toast.success('Logged out successfully!')

            setMobileOpen(false)

            window.location.replace('/login')
        } catch (error) {
            console.error('Logout failed:', error)

            toast.error('Failed to logout. Please try again.')

            setIsLoggingOut(false)
        }
    }

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
                                        className="flex size-9 items-center justify-center rounded-md hover:bg-muted md:hidden"
                                        aria-label="Open navigation menu"
                                    />
                                }
                            >
                                <Menu className="size-5" />
                            </SheetTrigger>

                            <SheetContent side="left" className="w-72">
                                <SheetHeader>
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

                                <div className="mt-6 flex flex-col gap-1 px-1">
                                    {navItems.map((item) => {
                                        const active = isActive(item.href)
                                        const Icon = item.icon

                                        return (
                                            <SheetClose
                                                key={item.href}
                                                render={<Link href={item.href} />}
                                                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors ${active
                                                    ? 'bg-primary/10 font-semibold text-primary'
                                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                                    }`}
                                            >
                                                <Icon className="size-4" />
                                                {item.label}
                                            </SheetClose>
                                        )
                                    })}
                                </div>

                                <div className="my-4 h-px bg-border" />

                                {user ? (
                                    <div className="flex flex-col gap-1 px-1">
                                        <div className="px-3 py-2">
                                            <p className="text-sm font-semibold">
                                                {user.name}
                                            </p>
                                            <p className="truncate text-xs text-muted-foreground">
                                                {user.email}
                                            </p>
                                            <p className="mt-1 text-xs font-medium text-primary">
                                                {user.role}
                                            </p>
                                        </div>

                                        <SheetClose
                                            render={<Link href={dashboardHref} />}
                                            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-muted"
                                        >
                                            <LayoutDashboard className="size-4" />
                                            Dashboard
                                        </SheetClose>

                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            disabled={isLoggingOut}
                                            className="flex items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:hover:bg-red-950/40"
                                        >
                                            <LogOut className="size-4" />
                                            {isLoggingOut ? 'Logging out...' : 'Logout'}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2 px-1">
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
                    <div className="hidden flex-1 items-center justify-center gap-6 lg:flex">
                        {navItems.map((item) => {
                            const active = isActive(item.href)

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`relative whitespace-nowrap py-5 text-sm font-medium transition-colors ${active
                                        ? 'text-primary'
                                        : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                >
                                    {item.label}

                                    {active && (
                                        <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary" />
                                    )}
                                </Link>
                            )
                        })}
                    </div>

                    {/* RIGHT: Theme + Authentication */}
                    <div className="flex flex-1 items-center justify-end gap-3">

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
                                        {isLoggingOut ? 'Logging out...' : 'Logout'}
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

                                <Button
                                    nativeButton={false}
                                    render={<Link href="/register" />}
                                >
                                    Sign Up
                                </Button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </nav>
    )
}
