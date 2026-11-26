import z from "zod";

const imageItemSchema = z
	.object({
		url: z.url("Image must be a valid URL"),
		publicId: z.string().trim().max(255).optional(),
		locationId: z.uuid().optional(),
		reportId: z.uuid().optional(),
		isPrimary: z.boolean().optional(),
	})
	.refine((data) => Boolean(data.locationId) !== Boolean(data.reportId), {
		message: "Exactly one of locationId or reportId is required",
	});

const UploadImageZodSchema = imageItemSchema;

const UploadMultipleZodSchema = z.object({
	items: z.array(imageItemSchema).min(1).max(20),
});

const PresignedUrlZodSchema = z.object({
	fileName: z.string().trim().min(1).max(255),
	contentType: z.string().trim().min(3).max(100),
	folder: z.string().trim().max(100).optional(),
});

export { PresignedUrlZodSchema, UploadImageZodSchema, UploadMultipleZodSchema };

export const UploadValidation = {
	imageItemSchema,
	UploadImageZodSchema,
	UploadMultipleZodSchema,
	PresignedUrlZodSchema,
};
