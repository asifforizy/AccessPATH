import {
  Building2,
  Bus,
  Check,
  GraduationCap,
  Landmark,
  MapPin,
  Minus,
  Trees,
  Users,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  AccessibilityFeatureKey,
  CategoryGroup,
  VerificationStatus,
} from "@/types/place.types";

/** Human labels for every accessibility feature. */
export const featureLabel: Record<AccessibilityFeatureKey, string> = {
  wheelchairAccessible: "Wheelchair access",
  rampAvailable: "Ramp available",
  elevatorAvailable: "Elevator",
  accessibleRestroom: "Accessible restroom",
  accessibleParking: "Accessible parking",
  stepFreeEntrance: "Step-free entrance",
  tactilePaving: "Tactile paving",
  brailleSignage: "Braille signage",
  hearingLoop: "Hearing loop",
};

export const formatDistance = (meters: number | null | undefined) => {
  if (meters === null || meters === undefined) return null;
  if (meters < 1_000) return `${Math.round(meters)} m`;
  return `${(meters / 1_000).toFixed(1)} km`;
};

export const verificationLabel: Record<VerificationStatus, string> = {
  verified: "Verified",
  unverified: "Not verified",
  unknown: "Accessibility unknown",
};

const verificationVariant: Record<
  VerificationStatus,
  "success" | "warning" | "outline"
> = {
  verified: "success",
  unverified: "warning",
  unknown: "outline",
};

/**
 * Verification is always written out as text — colour is never the only signal.
 */
export function VerificationBadge({
  status,
  className,
}: {
  status: VerificationStatus;
  className?: string;
}) {
  return (
    <Badge variant={verificationVariant[status]} className={className}>
      {verificationLabel[status]}
    </Badge>
  );
}

/**
 * Mirrors the API's category grouping so client-side category lists can show
 * the same glyphs as map markers.
 */
export const categoryGroupFromText = (
  name: string,
  slug: string,
): CategoryGroup => {
  const haystack = `${name} ${slug}`.toLowerCase();
  const rules: Array<[CategoryGroup, string[]]> = [
    ["PARK", ["park", "garden", "playground", "trail", "nature", "green"]],
    [
      "EDUCATION",
      ["school", "college", "university", "education", "library", "academy"],
    ],
    [
      "TRANSPORT",
      ["transport", "station", "transit", "bus", "train", "metro", "airport"],
    ],
    [
      "GOVERNMENT",
      [
        "government",
        "office",
        "city hall",
        "municipal",
        "courthouse",
        "post office",
      ],
    ],
    ["COMMUNITY", ["community", "centre", "center", "hub", "club"]],
    [
      "BUILDING",
      ["building", "museum", "hospital", "clinic", "mall", "bank", "public"],
    ],
  ];

  for (const [group, keywords] of rules) {
    if (keywords.some((keyword) => haystack.includes(keyword))) return group;
  }

  return "OTHER";
};

const groupIcons = {
  BUILDING: Building2,
  PARK: Trees,
  EDUCATION: GraduationCap,
  TRANSPORT: Bus,
  GOVERNMENT: Landmark,
  COMMUNITY: Users,
  OTHER: MapPin,
} satisfies Record<CategoryGroup, typeof MapPin>;

export function CategoryIcon({
  group,
  className,
}: {
  group: CategoryGroup;
  className?: string;
}) {
  const Icon = groupIcons[group] ?? MapPin;
  return <Icon aria-hidden="true" className={cn("size-3.5", className)} />;
}

/**
 * One accessibility feature with an explicit state.
 * `features === null` means unknown — rendered as "Unknown", never "Yes".
 */
export function FeatureState({
  feature,
  features,
  compact = false,
}: {
  feature: AccessibilityFeatureKey;
  features: Partial<Record<AccessibilityFeatureKey, boolean>> | null;
  compact?: boolean;
}) {
  const state =
    features === null || features[feature] === undefined
      ? "unknown"
      : features[feature]
        ? "yes"
        : "no";

  const Icon = state === "yes" ? Check : state === "no" ? X : Minus;

  const stateLabel =
    state === "yes"
      ? "Available"
      : state === "no"
        ? "Not available"
        : "Unknown";

  return (
    <span className="flex items-center justify-between gap-3 text-sm">
      <span className="text-muted-foreground">{featureLabel[feature]}</span>
      <span
        className={cn(
          "inline-flex items-center gap-1 text-xs font-medium",
          state === "yes" && "text-foreground",
          state === "no" && "text-muted-foreground",
          state === "unknown" && "text-muted-foreground",
        )}
      >
        <Icon aria-hidden="true" className="size-3.5" />
        {!compact && stateLabel}
        <span className="sr-only">{stateLabel}</span>
      </span>
    </span>
  );
}
