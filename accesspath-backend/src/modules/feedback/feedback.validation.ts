import z from "zod";

const ratingSchema = z.number().int().min(1).max(5);

const CreateFeedbackZodSchema = z.object({
	locationId: z.uuid(),
	rating: ratingSchema,
	comment: z.string().trim().max(2_000).optional(),
});

const CreateLocationReviewZodSchema = z.object({
	rating: ratingSchema,
	comment: z.string().trim().max(2_000).optional(),
});

const UpdateFeedbackZodSchema = z
	.object({
		rating: ratingSchema.optional(),
		comment: z.string().trim().max(2_000).optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field is required",
	});

const FeedbackListQueryZodSchema = z.object({
	locationId: z.uuid().optional(),
	userId: z.uuid().optional(),
});

const FlagFeedbackZodSchema = z.object({
	reason: z.string().trim().min(3).max(500),
});

export {
	CreateFeedbackZodSchema,
	CreateLocationReviewZodSchema,
	FeedbackListQueryZodSchema,
	FlagFeedbackZodSchema,
	UpdateFeedbackZodSchema,
};

export const FeedbackValidation = {
	ratingSchema,
	CreateFeedbackZodSchema,
	CreateLocationReviewZodSchema,
	UpdateFeedbackZodSchema,
	FeedbackListQueryZodSchema,
	FlagFeedbackZodSchema,
};
