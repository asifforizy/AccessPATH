import z from "zod";

const contributionTypeSchema = z.enum([
	"LOCATION_CREATE",
	"LOCATION_UPDATE",
	"ACCESSIBILITY_UPDATE",
]);

const contributionStatusSchema = z.enum(["PENDING", "APPROVED", "REJECTED"]);

const CreateContributionZodSchema = z
	.object({
		type: contributionTypeSchema,
		title: z.string().trim().min(3).max(160).optional(),
		description: z.string().trim().min(10).max(2_000).optional(),
		proposedData: z.record(z.string(), z.unknown()),
		locationId: z.uuid().optional(),
	})
	.refine(
		(data) => data.type === "LOCATION_CREATE" || Boolean(data.locationId),
		{
			message: "locationId is required for location and accessibility updates",
			path: ["locationId"],
		},
	);

const UpdateContributionZodSchema = z
	.object({
		title: z.string().trim().min(3).max(160).optional(),
		description: z.string().trim().min(10).max(2_000).optional(),
		proposedData: z.record(z.string(), z.unknown()).optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field is required",
	});

const ContributionListQueryZodSchema = z.object({
	status: contributionStatusSchema.optional(),
	type: contributionTypeSchema.optional(),
	locationId: z.uuid().optional(),
});

export {
	ContributionListQueryZodSchema,
	CreateContributionZodSchema,
	UpdateContributionZodSchema,
};

export const ContributionValidation = {
	contributionTypeSchema,
	contributionStatusSchema,
	CreateContributionZodSchema,
	UpdateContributionZodSchema,
	ContributionListQueryZodSchema,
};
