import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { getUserMe } from "@/services/me";

// Every signed-in surface is cookie-authenticated and dynamic; allow blocking render.
export const instant = false;

/**
 * Shared shell for every signed-in section of the app.
 *
 * Route groups were removed in favour of plain folders, so each top-level section
 * (`/explore`, `/reports`, …) owns a one-line `layout.tsx` that re-exports this
 * component. That keeps the sign-in guard and the page frame in one place.
 */
export default async function AppShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getUserMe();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-[calc(100dvh-4.0625rem)] flex-col bg-muted/30">
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
