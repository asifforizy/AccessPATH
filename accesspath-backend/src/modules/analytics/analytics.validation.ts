import z from "zod";

const MonthlyTrendsQueryZodSchema = z.object({
	months: z.coerce.number().int().min(1).max(24).default(12),
});

const HeatmapQueryZodSchema = z.object({
	limit: z.coerce.number().int().min(1).max(2_000).default(500),
});

const TopAreasQueryZodSchema = z.object({
	limit: z.coerce.number().int().min(1).max(50).default(10),
});

export {
	HeatmapQueryZodSchema,
	MonthlyTrendsQueryZodSchema,
	TopAreasQueryZodSchema,
};

export const AnalyticsValidation = {
	MonthlyTrendsQueryZodSchema,
	HeatmapQueryZodSchema,
	TopAreasQueryZodSchema,
};
