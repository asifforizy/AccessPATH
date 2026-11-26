import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getUserMe } from "@/services/me";

// Every surface in this group is cookie-authenticated and dynamic; allow blocking render.
export const instant = false;

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await getUserMe();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
