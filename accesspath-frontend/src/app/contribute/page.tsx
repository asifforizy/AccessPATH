import { CheckCircle2, ClipboardList, MapPin, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ContributionRow } from "@/components/contribution/contribution-row";
import { ActionButton } from "@/components/shared/action-button";
import { EmptyState } from "@/components/shared/empty-state";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import {
  deleteContribution,
  getContributionStatistics,
  getMyContributions,
} from "@/services/contributions";
import type { IPlaceCategory } from "@/types/place.types";

import { ContributionForm } from "./_components/contribution-form";

const tips = [
  {
    title: "Pin the exact entrance",
    description:
      "Not the middle of the building — the door people actually use.",
    icon: MapPin,
  },
  {
    title: "Answer only what you know",
    description: "“Not sure” is a valid answer and is never published as data.",
    icon: CheckCircle2,
  },
  {
    title: "A moderator checks it",
    description: "Most submissions are reviewed before they appear on the map.",
    icon: ShieldCheck,
  },
];

export default async function ContributePage() {
  const [contributions, categoriesRes, statsRes] = await Promise.all([
    getMyContributions(50),
    apiFetch<IPlaceCategory[]>("/places/categories"),
    getContributionStatistics(),
  ]);

  const categories = categoriesRes.success ? (categoriesRes.data ?? []) : [];
  const categoryNameById = new Map(
    categories.map((category) => [category.id, category.name]),
  );
  const mine = contributions.data ?? [];

  // Counts come from the statistics endpoint so they stay exact even when the
  // list is paginated. Every submission counts — including pending edits.
  const stats = statsRes.data;
  const total = stats?.total ?? contributions.meta?.total ?? mine.length;
  const pending =
    stats?.byStatus?.PENDING ??
    mine.filter((item) => item.status === "PENDING").length;
  const approved =
    stats?.byStatus?.APPROVED ??
    mine.filter((item) => item.status === "APPROVED").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Contribute</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Add a place, fix something that is wrong, or record what is accessible
          — a few taps help the next person plan a trip with confidence.
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
        <div className="min-w-0">
          <ContributionForm categories={categories} />
        </div>

        <aside className="space-y-4">
          <Card size="sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-1.5 text-sm">
                <ClipboardList
                  aria-hidden="true"
                  className="size-4 text-primary"
                />
                Your contributions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
                    Total
                  </dt>
                  <dd className="text-xl font-bold tabular-nums">{total}</dd>
                </div>
                <div>
                  <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
                    In review
                  </dt>
                  <dd className="text-xl font-bold tabular-nums">{pending}</dd>
                </div>
                <div>
                  <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
                    Approved
                  </dt>
                  <dd className="text-xl font-bold tabular-nums">{approved}</dd>
                </div>
              </dl>
              <p className="mt-2 text-[11px] text-muted-foreground">
                Every new place <em>or edit</em> is a separate submission, and
                edits also wait for a moderator before they go live.
              </p>
            </CardContent>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-sm">Good to know</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {tips.map((tip) => {
                  const Icon = tip.icon;
                  return (
                    <li key={tip.title} className="flex gap-2">
                      <Icon
                        aria-hidden="true"
                        className="mt-0.5 size-4 shrink-0 text-primary"
                      />
                      <span>
                        <span className="block text-xs font-medium">
                          {tip.title}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          {tip.description}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Card id="my-contributions">
        <CardHeader>
          <CardTitle>My contributions</CardTitle>
          <CardDescription>
            Track review status and remove submissions that are still
            actionable.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mine.length ? (
            <ul className="space-y-3">
              {mine.map((contribution) => (
                <ContributionRow
                  key={contribution.id}
                  contribution={contribution}
                  categoryName={categoryNameById.get(
                    (
                      contribution.proposedData as {
                        categoryId?: string;
                      } | null
                    )?.categoryId ?? "",
                  )}
                  actions={
                    <>
                      <Link
                        href={`/contributions/${contribution.id}`}
                        className="inline-flex h-7 items-center gap-1 rounded-md border border-border px-2 text-xs hover:bg-muted"
                      >
                        View
                      </Link>
                      <ActionButton
                        action={deleteContribution.bind(null, contribution.id)}
                        label="Delete"
                        variant="destructive"
                        size="xs"
                        confirm="Delete this contribution?"
                      />
                    </>
                  }
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              title="No contributions yet"
              description="Your submitted location updates will appear here."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Every surface here is cookie-authenticated and dynamic; allow blocking render.
export const instant = false;
