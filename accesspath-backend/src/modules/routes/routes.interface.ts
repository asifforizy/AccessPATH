import type { z } from "zod";
import type {
	AlternativesZodSchema,
	FeedbackZodSchema,
	PlanZodSchema,
	PreferencesZodSchema,
	ScoreZodSchema,
	ValidateZodSchema,
} from "./routes.validation";

export type IPlanPayload = z.infer<typeof PlanZodSchema>;
export type IAlternativesPayload = z.infer<typeof AlternativesZodSchema>;
export type IScorePayload = z.infer<typeof ScoreZodSchema>;
export type IFeedbackPayload = z.infer<typeof FeedbackZodSchema>;
export type IPreferencesPayload = z.infer<typeof PreferencesZodSchema>;
export type IValidatePayload = z.infer<typeof ValidateZodSchema>;
