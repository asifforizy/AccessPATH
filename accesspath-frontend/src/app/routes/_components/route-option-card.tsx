"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { IRouteOption, IRouteWarning } from "@/utils/types";

function ScoreBar({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "positive" | "negative";
}) {
  if (value === 0) return null;
  const width = Math.min(
    100,
    Math.max(4, Math.abs(value) * (tone === "negative" ? 2.5 : 4)),
  );

  return (
    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
      <span className="w-32 shrink-0">{label}</span>
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <span
          className={
            tone === "positive"
              ? "block h-full rounded-full bg-primary"
              : "block h-full rounded-full bg-destructive/70"
          }
          style={{ width: `${width}%` }}
        />
      </span>
      <span className="w-10 shrink-0 text-right font-medium text-foreground">
        {tone === "positive" ? "+" : "−"}
        {value}
      </span>
    </div>
  );
}

function WarningList({ warnings }: { warnings: IRouteWarning[] }) {
  if (warnings.length === 0) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CheckCircle2 aria-hidden="true" className="size-3.5" />
        No barriers reported along this corridor.
      </p>
    );
  }

  return (
    <ul className="space-y-1">
      {warnings.slice(0, 5).map((warning) => (
        <li
          key={`${warning.code}-${warning.distanceMeters ?? 0}-${warning.locationId ?? ""}`}
          className="flex items-start gap-1.5 text-xs"
        >
          <AlertTriangle
            aria-hidden="true"
            className={cn(
              "mt-0.5 size-3.5 shrink-0",
              warning.severity === "high"
                ? "text-destructive"
                : "text-muted-foreground",
            )}
          />
          <span>
            {warning.message}
            {typeof warning.distanceMeters === "number" && (
              <span className="text-muted-foreground">
                {" "}
                · {warning.distanceMeters} m from route
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

const gradeTone: Record<
  IRouteOption["grade"],
  "success" | "warning" | "destructive" | "outline"
> = {
  A: "success",
  B: "success",
  C: "warning",
  D: "warning",
  E: "destructive",
};

interface RouteOptionCardProps {
  option: IRouteOption;
  index: number;
  selected: boolean;
  onSelect: () => void;
}

export function RouteOptionCard({
  option,
  index,
  selected,
  onSelect,
}: RouteOptionCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border transition-colors",
        selected ? "border-primary bg-muted/50" : "border-border bg-card",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className="w-full rounded-xl p-3 text-left focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="flex min-w-0 flex-col gap-1">
            <span className="flex flex-wrap items-center gap-1.5">
              <Badge variant={option.recommended ? "success" : "outline"}>
                {option.recommended ? "Recommended" : `Option ${index + 1}`}
              </Badge>
              <Badge variant={gradeTone[option.grade]}>
                Grade {option.grade}
              </Badge>
            </span>
            <span className="text-sm font-semibold">
              {option.distanceText} · {option.durationText}
            </span>
          </span>

          <span className="shrink-0 text-right">
            <span className="block text-lg leading-none font-bold tabular-nums">
              {option.accessibilityScore}
            </span>
            <span className="text-[10px] tracking-wide text-muted-foreground uppercase">
              / 100
            </span>
          </span>
        </div>

        <p className="mt-1.5 text-xs text-muted-foreground">
          {option.support.sampledLocations} accessible place
          {option.support.sampledLocations === 1 ? "" : "s"} along the corridor
          · {option.support.verifiedRatio}% verified
          {option.support.stepFreeRatio > 0
            ? ` · ${option.support.stepFreeRatio}% step-free`
            : ""}
        </p>
      </button>

      {selected && (
        <div className="grid gap-3 border-t border-border px-3 pt-3 pb-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Why this score
            </p>
            <ScoreBar
              label="Verified data bonus"
              value={option.breakdown.supportBonus}
              tone="positive"
            />
            {option.breakdown.modeBonus > 0 && (
              <ScoreBar
                label="Step-free bonus"
                value={option.breakdown.modeBonus}
                tone="positive"
              />
            )}
            <ScoreBar
              label="Barrier penalty"
              value={option.breakdown.barrierPenalty}
              tone="negative"
            />
            <ScoreBar
              label="Detour penalty"
              value={option.breakdown.distancePenalty}
              tone="negative"
            />
            <ScoreBar
              label="Unverified data"
              value={option.breakdown.dataQualityPenalty}
              tone="negative"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
              Barriers
            </p>
            <WarningList warnings={option.warnings} />
          </div>
        </div>
      )}
    </div>
  );
}
