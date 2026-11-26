import { Check, CircleHelp, X } from "lucide-react";

import { featureLabel } from "@/components/map/map-meta";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { accessibilityFeatureKeys } from "@/types/place.types";
import type { IAccessibilityProfile } from "@/utils/types";

type FeatureState = "yes" | "no" | "unknown";

const stateOf = (value: unknown): FeatureState =>
  value === true ? "yes" : value === false ? "no" : "unknown";

const stateMeta: Record<
  FeatureState,
  { label: string; icon: typeof Check; badge: string; text: string }
> = {
  yes: {
    label: "Available",
    icon: Check,
    badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
    text: "text-emerald-700 dark:text-emerald-400",
  },
  no: {
    label: "Not available",
    icon: X,
    badge: "bg-destructive/15 text-destructive",
    text: "text-destructive",
  },
  unknown: {
    label: "Unknown",
    icon: CircleHelp,
    badge: "bg-muted text-muted-foreground",
    text: "text-muted-foreground",
  },
};

function scoreTone(score: number) {
  if (score >= 80) {
    return {
      label: "Good access",
      stroke: "stroke-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
    };
  }
  if (score >= 50) {
    return {
      label: "Partial access",
      stroke: "stroke-amber-500",
      text: "text-amber-600 dark:text-amber-400",
    };
  }
  return {
    label: "Limited access",
    stroke: "stroke-destructive",
    text: "text-destructive",
  };
}

function ScoreRing({ score }: { score: number | null }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const value =
    typeof score === "number" ? Math.max(0, Math.min(100, score)) : null;
  const tone = value === null ? null : scoreTone(value);

  return (
    <div className="relative grid size-24 shrink-0 place-items-center">
      <svg
        viewBox="0 0 96 96"
        className="absolute inset-0 size-full -rotate-90"
        aria-hidden="true"
      >
        <circle
          cx="48"
          cy="48"
          r={radius}
          fill="none"
          strokeWidth="8"
          className="stroke-muted"
        />
        {value !== null && (
          <circle
            cx="48"
            cy="48"
            r={radius}
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(circumference * value) / 100} ${circumference}`}
            className={tone?.stroke}
          />
        )}
      </svg>

      <div className="text-center">
        <p className="text-xl leading-none font-bold tabular-nums">
          {value === null ? "—" : value}
        </p>
        <p className="mt-0.5 text-[10px] tracking-wide text-muted-foreground uppercase">
          {value === null ? "No score" : "/ 100"}
        </p>
      </div>
    </div>
  );
}

interface AccessibilityCardProps {
  accessibility?: IAccessibilityProfile | null;
}

/**
 * Feature checklist with three explicit states. `unknown` is shown as its own
 * state so a place is never implied to be accessible without data.
 */
export function AccessibilityCard({ accessibility }: AccessibilityCardProps) {
  const score =
    typeof accessibility?.accessibilityScore === "number"
      ? accessibility.accessibilityScore
      : null;
  const tone = score === null ? null : scoreTone(score);

  const states = accessibilityFeatureKeys.map((key) => {
    const value = accessibility?.[key];
    return { key, state: value === null ? "unknown" : stateOf(value) };
  });

  const available = states.filter((entry) => entry.state === "yes").length;
  const missing = states.filter((entry) => entry.state === "no").length;
  const unknown = states.length - available - missing;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Accessibility</CardTitle>
        <CardDescription>
          {accessibility
            ? `${available} of ${states.length} features confirmed available.`
            : "No accessibility profile has been recorded for this place yet."}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <ScoreRing score={score} />

          <div className="min-w-0 space-y-1.5">
            {tone && (
              <p className={cn("text-sm font-semibold", tone.text)}>
                {tone.label}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              {available} available · {missing} not available · {unknown}{" "}
              unknown
            </p>

            <div className="flex flex-wrap gap-1">
              {accessibility?.isVerified ? (
                <Badge variant="success">Verified by the community</Badge>
              ) : accessibility ? (
                <Badge variant="warning">Not verified yet</Badge>
              ) : (
                <Badge variant="outline">Accessibility unknown</Badge>
              )}
            </div>
          </div>
        </div>

        <ul className="grid gap-1.5 sm:grid-cols-2">
          {states.map(({ key, state }) => {
            const meta = stateMeta[state];
            const StateIcon = meta.icon;

            return (
              <li
                key={key}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-2.5 py-1.5"
              >
                <span className="min-w-0 truncate text-sm">
                  {featureLabel[key]}
                </span>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                    meta.badge,
                  )}
                >
                  <StateIcon aria-hidden="true" className="size-3" />
                  {meta.label}
                </span>
              </li>
            );
          })}
        </ul>

        {accessibility?.notes && (
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Community notes
            </p>
            <p className="mt-1 text-sm text-foreground/90">
              {accessibility.notes}
            </p>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          “Unknown” means nobody has recorded this feature yet — it is never
          treated as accessible.
        </p>
      </CardContent>
    </Card>
  );
}
