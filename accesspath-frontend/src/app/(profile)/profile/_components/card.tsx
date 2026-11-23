import Link from "next/link";
import type { ReactNode } from "react";

interface ProfileCardProps {
  title: string;
  href?: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function ProfileCard({ title, href, icon, children }: ProfileCardProps) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-sm font-semibold text-card-foreground">{title}</h2>
        </div>
        {href && (
          <Link
            href={href}
            className="text-xs font-medium text-primary hover:underline"
          >
            View all →
          </Link>
        )}
      </header>
      <div className="p-5">{children}</div>
    </section>
  );
}