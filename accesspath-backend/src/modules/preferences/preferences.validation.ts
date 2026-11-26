import z from "zod";
import { TravelMode } from "../../../prisma/generated/prisma/enums";

const UpdatePreferencesZodSchema = z
	.object({
		travelMode: z.enum(TravelMode).optional(),
		accessibilityNeeds: z.record(z.string(), z.unknown()).optional(),
		preferredLanguage: z.string().trim().min(2).max(10).optional(),
		notificationEnabled: z.boolean().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field is required",
	});

const UpdateAccessibilityZodSchema = z.object({
	accessibilityNeeds: z.record(z.string(), z.unknown()),
});

const RecommendationsQueryZodSchema = z.object({
	limit: z.coerce.number().int().min(1).max(50).default(10),
});

export {
	RecommendationsQueryZodSchema,
	UpdateAccessibilityZodSchema,
	UpdatePreferencesZodSchema,
};

export const PreferenceValidation = {
	UpdatePreferencesZodSchema,
	UpdateAccessibilityZodSchema,
	RecommendationsQueryZodSchema,
};
