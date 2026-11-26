import z from "zod";

const travelModeSchema = z.enum([
	"WALKING",
	"WHEELCHAIR",
	"CYCLING",
	"DRIVING",
]);

const coordinateSchema = z.object({
	name: z.string().trim().min(1).max(120).optional(),
	latitude: z.number().min(-90).max(90),
	longitude: z.number().min(-180).max(180),
});

const PlanZodSchema = z.object({
	origin: coordinateSchema,
	destination: coordinateSchema,
	travelMode: travelModeSchema.optional(),
	accessibilityRequirements: z.record(z.string(), z.unknown()).optional(),
	save: z.boolean().optional().default(false),
	name: z.string().trim().max(120).optional(),
});

const AlternativesZodSchema = PlanZodSchema.extend({
	count: z.number().int().min(2).max(4).default(3),
});

const ScoreZodSchema = z
	.object({
		routeId: z.uuid().optional(),
		origin: coordinateSchema.optional(),
		destination: coordinateSchema.optional(),
		radiusMeters: z.number().int().min(100).max(10_000).default(1_000),
	})
	.refine((data) => Boolean(data.routeId) || Boolean(data.destination), {
		message: "routeId or destination is required",
	});

const FeedbackZodSchema = z.object({
	rating: z.number().int().min(1).max(5),
	comment: z.string().trim().max(1_000).optional(),
});

const PreferencesZodSchema = z
	.object({
		travelMode: travelModeSchema.optional(),
		accessibilityNeeds: z.record(z.string(), z.unknown()).optional(),
		preferredLanguage: z.string().trim().min(2).max(10).optional(),
		notificationEnabled: z.boolean().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field is required",
	});

const ValidateZodSchema = z.object({
	origin: coordinateSchema,
	destination: coordinateSchema,
	travelMode: travelModeSchema.optional(),
});

export {
	AlternativesZodSchema,
	FeedbackZodSchema,
	PlanZodSchema,
	PreferencesZodSchema,
	ScoreZodSchema,
	ValidateZodSchema,
};

export const RouteValidation = {
	travelModeSchema,
	coordinateSchema,
	PlanZodSchema,
	AlternativesZodSchema,
	ScoreZodSchema,
	FeedbackZodSchema,
	PreferencesZodSchema,
	ValidateZodSchema,
};
