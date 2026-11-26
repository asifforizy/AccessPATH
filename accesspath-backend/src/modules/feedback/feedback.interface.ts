import type { z } from "zod";
import type {
	CreateFeedbackZodSchema,
	CreateLocationReviewZodSchema,
	FeedbackListQueryZodSchema,
	FlagFeedbackZodSchema,
	UpdateFeedbackZodSchema,
} from "./feedback.validation";

export type ICreateFeedbackPayload = z.infer<typeof CreateFeedbackZodSchema>;
export type ICreateLocationReviewPayload = z.infer<
	typeof CreateLocationReviewZodSchema
>;
export type IUpdateFeedbackPayload = z.infer<typeof UpdateFeedbackZodSchema>;
export type IFeedbackListQuery = z.infer<typeof FeedbackListQueryZodSchema>;
export type IFlagFeedbackPayload = z.infer<typeof FlagFeedbackZodSchema>;
