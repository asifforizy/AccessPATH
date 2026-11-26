import z from "zod";
import {
	accessibilityFiltersSchema,
	optionalTrimmedString,
} from "../../utils/query";

const ExploreQueryZodSchema = z
	.object({
		north: z.coerce.number().min(-90).max(90),
		south: z.coerce.number().min(-90).max(90),
		east: z.coerce.number().min(-180).max(180),
		west: z.coerce.number().min(-180).max(180),
		zoom: z.coerce.number().min(0).max(22).optional(),
		category: optionalTrimmedString(120),
		limit: z.coerce.number().int().min(1).max(1000).default(400),
	})
	.extend(accessibilityFiltersSchema.shape)
	.refine((value) => value.north > value.south, {
		message: "north must be greater than south",
		path: ["north"],
	});

export { ExploreQueryZodSchema };

export const MapValidation = {
	ExploreQueryZodSchema,
};
