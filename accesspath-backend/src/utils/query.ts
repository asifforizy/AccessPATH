import z from "zod";

/**
 * Query-string helpers.
 *
 * `validateRequest` only parses `req.body`, so query strings are validated
 * explicitly with `parseQuery` + these schemas.
 */

/** "true"/"1" => true, "false"/"0" => false, missing/empty => undefined. */
export const optionalBooleanQuery = z.preprocess((value) => {
	if (value === undefined || value === null || value === "") return undefined;
	if (value === true || value === "true" || value === "1") return true;
	if (value === false || value === "false" || value === "0") return false;
	return value;
}, z.boolean().optional());

export const optionalTrimmedString = (max = 120) =>
	z.preprocess((value) => {
		if (typeof value !== "string") return undefined;
		const trimmed = value.trim();
		return trimmed.length ? trimmed.slice(0, max) : undefined;
	}, z.string().max(max).optional());

/**
 * Accessibilities filters shared by the map + places endpoints.
 * Presence of any filter means the location must have an accessibility
 * profile that explicitly satisfies it (unknown never matches).
 */
export const accessibilityFiltersSchema = z.object({
	wheelchairAccess: optionalBooleanQuery,
	rampAvailable: optionalBooleanQuery,
	elevatorAvailable: optionalBooleanQuery,
	accessibleRestroom: optionalBooleanQuery,
	accessibleParking: optionalBooleanQuery,
	stepFreeEntrance: optionalBooleanQuery,
	verifiedOnly: optionalBooleanQuery,
});

export type IAccessibilityFiltersQuery = z.infer<
	typeof accessibilityFiltersSchema
>;
