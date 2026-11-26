import type { z } from "zod";
import type {
	RecommendationsQueryZodSchema,
	UpdateAccessibilityZodSchema,
	UpdatePreferencesZodSchema,
} from "./preferences.validation";

export type IUpdatePreferencesPayload = z.infer<
	typeof UpdatePreferencesZodSchema
>;
export type IUpdateAccessibilityPayload = z.infer<
	typeof UpdateAccessibilityZodSchema
>;
export type IRecommendationsQuery = z.infer<
	typeof RecommendationsQueryZodSchema
>;
