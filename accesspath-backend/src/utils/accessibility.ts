/**
 * Shared accessibility helpers used by the map + places APIs.
 *
 * A location without an AccessibilityProfile has *unknown* accessibility.
 * Unknown is never treated as accessible: feature filters only match explicit
 * `true` values, and verification status is reported as "unknown".
 */

export const accessibilityFeatureKeys = [
	"wheelchairAccessible",
	"rampAvailable",
	"elevatorAvailable",
	"accessibleRestroom",
	"accessibleParking",
	"stepFreeEntrance",
	"tactilePaving",
	"brailleSignage",
	"hearingLoop",
] as const;

export type AccessibilityFeatureKey = (typeof accessibilityFeatureKeys)[number];

export type VerificationStatus = "verified" | "unverified" | "unknown";

export type CategoryGroup =
	| "BUILDING"
	| "PARK"
	| "EDUCATION"
	| "TRANSPORT"
	| "GOVERNMENT"
	| "COMMUNITY"
	| "OTHER";

export interface IAccessibilitySource {
	wheelchairAccessible?: boolean | null;
	rampAvailable?: boolean | null;
	elevatorAvailable?: boolean | null;
	accessibleRestroom?: boolean | null;
	accessibleParking?: boolean | null;
	stepFreeEntrance?: boolean | null;
	tactilePaving?: boolean | null;
	brailleSignage?: boolean | null;
	hearingLoop?: boolean | null;
	isVerified?: boolean | null;
	accessibilityScore?: number | null;
	additionalInformation?: string | null;
}

export type AccessibilityFlags = Record<AccessibilityFeatureKey, boolean>;

export const featureFlags = (
	profile: IAccessibilitySource | null | undefined,
): AccessibilityFlags | null => {
	if (!profile) return null;

	return {
		wheelchairAccessible: profile.wheelchairAccessible === true,
		rampAvailable: profile.rampAvailable === true,
		elevatorAvailable: profile.elevatorAvailable === true,
		accessibleRestroom: profile.accessibleRestroom === true,
		accessibleParking: profile.accessibleParking === true,
		stepFreeEntrance: profile.stepFreeEntrance === true,
		tactilePaving: profile.tactilePaving === true,
		brailleSignage: profile.brailleSignage === true,
		hearingLoop: profile.hearingLoop === true,
	};
};

export const verificationStatus = (
	profile: IAccessibilitySource | null | undefined,
): VerificationStatus => {
	if (!profile) return "unknown";
	return profile.isVerified === true ? "verified" : "unverified";
};

const groupMatchers: Array<{ group: CategoryGroup; keywords: string[] }> = [
	{
		group: "PARK",
		keywords: ["park", "garden", "playground", "trail", "nature", "green"],
	},
	{
		group: "EDUCATION",
		keywords: [
			"school",
			"college",
			"university",
			"education",
			"library",
			"academy",
			"learning",
		],
	},
	{
		group: "TRANSPORT",
		keywords: [
			"transport",
			"station",
			"transit",
			"bus",
			"train",
			"metro",
			"airport",
			"terminal",
			"parking",
		],
	},
	{
		group: "GOVERNMENT",
		keywords: [
			"government",
			"office",
			"city hall",
			"municipal",
			"courthouse",
			"post office",
			"embassy",
		],
	},
	{
		group: "COMMUNITY",
		keywords: [
			"community",
			"centre",
			"center",
			"hub",
			"club",
			"mosque",
			"church",
		],
	},
	{
		group: "BUILDING",
		keywords: [
			"building",
			"museum",
			"hospital",
			"clinic",
			"mall",
			"bank",
			"theatre",
			"theater",
			"restaurant",
			"cafe",
			"hotel",
			"public",
		],
	},
];

export const categoryGroup = (
	name: string | null | undefined,
	slug: string | null | undefined,
): CategoryGroup => {
	const haystack = `${name ?? ""} ${slug ?? ""}`.toLowerCase();

	for (const { group, keywords } of groupMatchers) {
		if (keywords.some((keyword) => haystack.includes(keyword))) {
			return group;
		}
	}

	return "OTHER";
};
