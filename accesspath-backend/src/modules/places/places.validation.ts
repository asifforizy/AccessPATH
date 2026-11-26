import z from "zod";
import {
	accessibilityFiltersSchema,
	optionalTrimmedString,
} from "../../utils/query";

export const placeSortValues = [
	"nearest",
	"score",
	"recently_verified",
] as const;

const NearbyQueryZodSchema = z
	.object({
		latitude: z.coerce.number().min(-90).max(90),
		longitude: z.coerce.number().min(-180).max(180),
		radius: z.coerce.number().int().min(50).max(50_000).default(2_000),
		limit: z.coerce.number().int().min(1).max(100).default(50),
		category: optionalTrimmedString(120),
	})
	.extend(accessibilityFiltersSchema.shape);

const SearchQueryZodSchema = z
	.object({
		query: optionalTrimmedString(120),
		q: optionalTrimmedString(120),
		category: optionalTrimmedString(120),
		sort: z.enum(placeSortValues).default("score"),
		latitude: z.coerce.number().min(-90).max(90).optional(),
		longitude: z.coerce.number().min(-180).max(180).optional(),
		page: z.coerce.number().int().min(1).default(1),
		limit: z.coerce.number().int().min(1).max(50).default(20),
	})
	.extend(accessibilityFiltersSchema.shape)
	.transform((value) => ({ ...value, query: value.query ?? value.q }));

export type INearbyQuery = z.infer<typeof NearbyQueryZodSchema>;
export type ISearchQuery = z.infer<typeof SearchQueryZodSchema>;

export const PlaceValidation = {
	NearbyQueryZodSchema,
	SearchQueryZodSchema,
};
