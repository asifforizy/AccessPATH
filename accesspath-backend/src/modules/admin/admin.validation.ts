import z from "zod";

const AuditLogQueryZodSchema = z.object({
	action: z.string().trim().max(100).optional(),
	actorId: z.uuid().optional(),
	entityType: z.string().trim().max(100).optional(),
	entityId: z.string().trim().max(100).optional(),
	from: z.coerce.date().optional(),
	to: z.coerce.date().optional(),
});

const UpdateSettingsZodSchema = z
	.object({
		siteName: z.string().trim().min(1).max(120).optional(),
		supportEmail: z.email().optional(),
		maintenanceMode: z.boolean().optional(),
		allowRegistrations: z.boolean().optional(),
		defaultPageSize: z.coerce.number().int().min(1).max(100).optional(),
		maxUploadSizeMb: z.coerce.number().int().min(1).max(100).optional(),
		features: z.record(z.string(), z.boolean()).optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field is required",
	});

export { AuditLogQueryZodSchema, UpdateSettingsZodSchema };

export const AdminValidation = {
	AuditLogQueryZodSchema,
	UpdateSettingsZodSchema,
};
