import type { z } from "zod";
import type {
	HeatmapQueryZodSchema,
	MonthlyTrendsQueryZodSchema,
	TopAreasQueryZodSchema,
} from "./analytics.validation";

export type IMonthlyTrendsQuery = z.infer<typeof MonthlyTrendsQueryZodSchema>;
export type IHeatmapQuery = z.infer<typeof HeatmapQueryZodSchema>;
export type ITopAreasQuery = z.infer<typeof TopAreasQueryZodSchema>;
