"use client";

import { Check, CircleHelp, X } from "lucide-react";

import { cn } from "@/lib/utils";

/** Features a contributor can record, with a plain-language hint each. */
export const contributionFeatures = [
  {
    key: "wheelchairAccessible",
    label: "Wheelchair access",
    hint: "A wheelchair can get in and move around",
  },
  {
    key: "rampAvailable",
    label: "Ramp",
    hint: "A ramp at the entrance",
  },
  {
    key: "elevatorAvailable",
    label: "Elevator",
    hint: "A lift to reach other floors",
  },
  {
    key: "accessibleRestroom",
    label: "Accessible restroom",
    hint: "Grab rails and room to turn",
  },
  {
    key: "accessibleParking",
    label: "Accessible parking",
    hint: "A marked bay near the entrance",
  },
  {
    key: "stepFreeEntrance",
    label: "Step-free entrance",
    hint: "No steps at the door",
  },
  {
    key: "doorAccessibility",
    label: "Accessible door",
    hint: "Wide and easy to open",
  },
  {
    key: "tactilePaving",
    label: "Tactile paving",
    hint: "Guiding surface for canes",
  },
  {
    key: "brailleSignage",
    label: "Braille signage",
    hint: "Braille on signs or buttons",
  },
  {
    key: "hearingLoop",
    label: "Hearing loop",
    hint: "Works with hearing aids",
  },
] as const;

export type ContributionFeatureKey =
  (typeof contributionFeatures)[number]["key"];

export type FeatureState = "yes" | "no" | "unknown";

const stateOptions = [
  {
    value: "yes" as const,
    label: "Yes",
    icon: Check,
    active:
      "bg-emerald-500/20 text-emerald-700 ring-1 ring-emerald-500/40 dark:text-emerald-400",
  },
  {
    value: "no" as const,
    label: "No",
    icon: X,
    active: "bg-destructive/15 text-destructive ring-1 ring-destructive/40",
  },
  {
    value: "unknown" as const,
    label: "Not sure",
    icon: CircleHelp,
    active: "bg-muted text-foreground ring-1 ring-border",
  },
];

interface AccessibilityStatesProps {
  values: Partial<Record<ContributionFeatureKey, FeatureState>>;
  onChange: (key: ContributionFeatureKey, state: FeatureState) => void;
}

/**
 * Three-state accessibility checklist.
 *
 * "Not sure" is the default and is never submitted as data, so a contributor is
 * never forced to guess and an unknown feature can't be read as "accessible".
 */
export function AccessibilityStates({
  values,
  onChange,
}: AccessibilityStatesProps) {
  return (
    <ul className="grid gap-1.5 sm:grid-cols-2">
      {contributionFeatures.map((feature) => {
        const current = values[feature.key] ?? "unknown";

        return (
          <li
            key={feature.key}
            className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/20 py-1.5 pr-1.5 pl-2.5"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm">{feature.label}</span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {feature.hint}
              </span>
            </span>

            <span className="flex shrink-0 items-center gap-0.5">
              {stateOptions.map((option) => {
                const Icon = option.icon;
                const active = current === option.value;

                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={active}
                    title={`${feature.label}: ${option.label}`}
                    onClick={() => onChange(feature.key, option.value)}
                    className={cn(
                      "grid size-7 place-items-center rounded-md transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 outline-none",
                      active
                        ? option.active
                        : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    <Icon aria-hidden="true" className="size-3.5" />
                    <span className="sr-only">
                      {feature.label}: {option.label}
                    </span>
                  </button>
                );
              })}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
