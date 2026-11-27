/**
 * Turns a contribution's `proposedData` blob into something a person can read.
 *
 * The API stores whatever the contributor sent as free-form JSON. Nothing in the
 * UI should ever show that raw, so every surface (list rows, detail page) reads
 * it through these helpers instead.
 */

export interface ContributionTypeInfo {
  label: string;
  blurb: string;
}

export const contributionTypeInfo: Record<string, ContributionTypeInfo> = {
  LOCATION_CREATE: {
    label: "New place",
    blurb: "A place that is not on the map yet.",
  },
  LOCATION_UPDATE: {
    label: "Details correction",
    blurb: "A correction to a place that is already listed.",
  },
  ACCESSIBILITY_UPDATE: {
    label: "Accessibility record",
    blurb: "What is and is not accessible at an existing place.",
  },
};

export const typeLabel = (type: string) =>
  contributionTypeInfo[type]?.label ??
  type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const typeBlurb = (type: string) =>
  contributionTypeInfo[type]?.blurb ??
  "A change submitted for moderator review.";

const featureLabels: Record<string, string> = {
  wheelchairAccessible: "Wheelchair access",
  rampAvailable: "Ramp",
  elevatorAvailable: "Elevator",
  accessibleRestroom: "Accessible restroom",
  accessibleParking: "Accessible parking",
  stepFreeEntrance: "Step-free entrance",
  doorAccessibility: "Accessible door",
  tactilePaving: "Tactile paving",
  brailleSignage: "Braille signage",
  hearingLoop: "Hearing loop",
};

/** Falls back to a readable sentence for keys we do not know yet. */
export const featureLabel = (key: string) =>
  featureLabels[key] ??
  key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (character) => character.toUpperCase());

export interface RecordedFeature {
  key: string;
  label: string;
}

export interface ContributionModel {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  categoryId?: string;
  photoUrl?: string;
  score?: number;
  note?: string;
  /** Features the contributor marked as present. */
  available: RecordedFeature[];
  /** Features the contributor explicitly marked as missing. */
  unavailable: RecordedFeature[];
}

const asText = (value: unknown) =>
  typeof value === "string" && value.trim() ? value.trim() : undefined;

const asNumber = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

export function readContribution(raw: unknown): ContributionModel {
  const data = asRecord(raw);
  const rawFeatures = asRecord(data.features);

  const available: RecordedFeature[] = [];
  const unavailable: RecordedFeature[] = [];

  const push = (key: string, value: unknown) => {
    if (typeof value !== "boolean") return;
    const entry = { key, label: featureLabel(key) };
    (value ? available : unavailable).push(entry);
  };

  for (const [key, value] of Object.entries(rawFeatures)) push(key, value);

  // Older submissions stored a single flag at the top level.
  if (!("wheelchairAccessible" in rawFeatures)) {
    push("wheelchairAccessible", data.wheelchairAccessible);
  }

  return {
    name: asText(data.name),
    address: asText(data.address),
    city: asText(data.city),
    state: asText(data.state),
    postalCode: asText(data.postalCode),
    country: asText(data.country),
    latitude: asNumber(data.latitude),
    longitude: asNumber(data.longitude),
    categoryId: asText(data.categoryId),
    photoUrl: asText(data.photoUrl),
    score: asNumber(data.accessibilityScore),
    note: asText(data.additionalInformation) ?? asText(data.description),
    available,
    unavailable,
  };
}

/** "Dhanmondi, Dhaka" or just the address when there is no city. */
export function placeLine(model: ContributionModel) {
  const cityLine = [model.city, model.state].filter(Boolean).join(", ");
  return cityLine || model.address || undefined;
}

export const recordedFeatureCount = (model: ContributionModel) =>
  model.available.length + model.unavailable.length;

export const formatCoordinate = (value: number) => value.toFixed(5);

/** Short human facts for a list row, most meaningful first. */
export function contributionFacts(
  model: ContributionModel,
  options: { type: string; categoryName?: string | null },
): string[] {
  const facts: string[] = [];
  const featureCount = recordedFeatureCount(model);

  if (options.type === "LOCATION_CREATE") {
    if (options.categoryName) facts.push(options.categoryName);
    const where = placeLine(model);
    if (where) facts.push(where);
    if (featureCount > 0) {
      facts.push(
        `${featureCount} accessibility ${featureCount === 1 ? "feature" : "features"}`,
      );
    }
  } else if (options.type === "LOCATION_UPDATE") {
    const corrected = [
      model.name && "name",
      model.address && "address",
      model.city && "city",
    ].filter(Boolean) as string[];
    if (corrected.length) facts.push(`Corrects ${corrected.join(", ")}`);
  } else {
    if (featureCount > 0) {
      facts.push(
        `${featureCount} accessibility ${featureCount === 1 ? "feature" : "features"}`,
      );
    }
  }

  if (model.score !== undefined)
    facts.push(`Score ${Math.round(model.score)}/100`);
  if (model.photoUrl) facts.push("Photo attached");
  if (model.note && facts.length < 3) facts.push("Note attached");
  if (model.latitude !== undefined && model.longitude !== undefined) {
    facts.push(facts.length ? "Pinned on map" : "Map pin attached");
  }

  return facts.slice(0, 4);
}

/** Neutral wording for the contributor's own score — never a verdict. */
export const scoreBand = (score: number) => {
  if (score >= 70) return "Mostly accessible";
  if (score >= 40) return "Partly accessible";
  return "Few accessible features";
};
