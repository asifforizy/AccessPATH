import z from "zod";

const ListLocationsQueryZodSchema = z.object({
	q: z
		.string()
		.trim()
		.min(1)
		.max(100)
		.optional(),
	city: z
		.string()
		.trim()
		.min(1)
		.max(100)
		.optional(),
	categoryId: z.uuid().optional(),
	page: z.coerce
		.number()
		.int("Page must be an integer")
		.min(1, "Page must be at least 1")
		.default(1),
	limit: z.coerce
		.number()
		.int("Limit must be an integer")
		.min(1, "Limit must be at least 1")
		.max(100, "Limit cannot exceed 100")
		.default(12),
});

export { ListLocationsQueryZodSchema };

export const LocationValidation = {
	ListLocationsQueryZodSchema,
};
