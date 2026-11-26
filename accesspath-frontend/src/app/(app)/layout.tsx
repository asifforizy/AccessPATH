import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AppSidebar } from "@/components/shared/app-sidebar";
import { getUserMe } from "@/services/me";

// Every surface in this group is cookie-authenticated and dynamic; allow blocking render.
export const instant = false;

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getUserMe();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <AppSidebar role={user.role} />
        <main className="min-w-0 flex-1 space-y-6">{children}</main>
      </div>
    </div>
  );
}
