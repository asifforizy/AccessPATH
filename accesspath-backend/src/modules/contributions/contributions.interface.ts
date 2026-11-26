import type { z } from "zod";
import type {
	ContributionListQueryZodSchema,
	CreateContributionZodSchema,
	UpdateContributionZodSchema,
} from "./contributions.validation";

export type ICreateContributionPayload = z.infer<
	typeof CreateContributionZodSchema
>;
export type IUpdateContributionPayload = z.infer<
	typeof UpdateContributionZodSchema
>;
export type IContributionListQuery = z.infer<
	typeof ContributionListQueryZodSchema
>;
