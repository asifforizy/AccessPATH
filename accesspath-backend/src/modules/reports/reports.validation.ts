import z from "zod";

const reportTypeSchema = z.enum([
	"ACCESSIBILITY_ISSUE",
	"INCORRECT_INFORMATION",
	"LOCATION_CLOSED",
	"MISSING_FEATURE",
	"OTHER",
]);

const reportStatusSchema = z.enum([
	"PENDING",
	"UNDER_REVIEW",
	"RESOLVED",
	"REJECTED",
]);

const attachmentSchema = z.object({
	url: z.url("Attachment must be a valid URL"),
	publicId: z.string().trim().max(255).optional(),
});

const CreateReportZodSchema = z.object({
	locationId: z.uuid(),
	type: reportTypeSchema,
	description: z
		.string()
		.trim()
		.min(10, "Description must be at least 10 characters")
		.max(2_000),
	attachments: z.array(attachmentSchema).max(10).optional(),
});

const UpdateReportZodSchema = z
	.object({
		type: reportTypeSchema.optional(),
		description: z.string().trim().min(10).max(2_000).optional(),
		status: reportStatusSchema.optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field is required",
	});

const AddAttachmentsZodSchema = z.object({
	attachments: z.array(attachmentSchema).min(1).max(10),
});

const ReportListQueryZodSchema = z.object({
	status: reportStatusSchema.optional(),
	type: reportTypeSchema.optional(),
	locationId: z.uuid().optional(),
});

const NearbyQueryZodSchema = z.object({
	latitude: z.coerce.number().min(-90).max(90),
	longitude: z.coerce.number().min(-180).max(180),
	radiusMeters: z.coerce.number().int().min(100).max(50_000).default(5_000),
});

export {
	AddAttachmentsZodSchema,
	CreateReportZodSchema,
	NearbyQueryZodSchema,
	ReportListQueryZodSchema,
	UpdateReportZodSchema,
};

export const ReportValidation = {
	reportTypeSchema,
	reportStatusSchema,
	CreateReportZodSchema,
	UpdateReportZodSchema,
	AddAttachmentsZodSchema,
	ReportListQueryZodSchema,
	NearbyQueryZodSchema,
};
