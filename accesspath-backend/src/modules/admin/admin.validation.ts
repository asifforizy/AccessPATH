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

const UserListQueryZodSchema = z.object({
	q: z.string().trim().max(120).optional(),
	role: z.enum(["ADMIN", "MODERATOR", "CONTRIBUTOR", "USER"]).optional(),
	status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "DELETED"]).optional(),
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

const UpdateUserZodSchema = z
	.object({
		role: z.enum(["ADMIN", "MODERATOR", "CONTRIBUTOR", "USER"]).optional(),
		status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "DELETED"]).optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field is required",
	});

const CreateCategoryZodSchema = z.object({
	name: z.string().trim().min(2).max(80),
	slug: z.string().trim().min(2).max(80).optional(),
	description: z.string().trim().max(500).optional(),
	icon: z.string().trim().max(60).optional(),
});

const UpdateCategoryZodSchema = z
	.object({
		name: z.string().trim().min(2).max(80).optional(),
		description: z.string().trim().max(500).optional(),
		icon: z.string().trim().max(60).optional(),
		isActive: z.boolean().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field is required",
	});

const LocationListQueryZodSchema = z.object({
	q: z.string().trim().max(120).optional(),
	status: z.enum(["PENDING", "APPROVED", "REJECTED", "ARCHIVED"]).optional(),
	categoryId: z.uuid().optional(),
	page: z.coerce.number().int().min(1).default(1),
	limit: z.coerce.number().int().min(1).max(100).default(20),
});

const UpdateLocationZodSchema = z
	.object({
		name: z.string().trim().min(2).max(160).optional(),
		description: z.string().trim().max(2000).optional(),
		address: z.string().trim().min(3).max(300).optional(),
		city: z.string().trim().min(1).max(120).optional(),
		state: z.string().trim().max(120).optional(),
		country: z.string().trim().min(1).max(120).optional(),
		postalCode: z.string().trim().max(20).optional(),
		latitude: z.number().min(-90).max(90).optional(),
		longitude: z.number().min(-180).max(180).optional(),
		categoryId: z.uuid().optional(),
		status: z.enum(["PENDING", "APPROVED", "REJECTED", "ARCHIVED"]).optional(),
		phone: z.string().trim().max(40).optional(),
		website: z.url().optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field is required",
	});

const UpdateAccessibilityZodSchema = z
	.object({
		wheelchairAccessible: z.boolean().optional(),
		rampAvailable: z.boolean().optional(),
		elevatorAvailable: z.boolean().optional(),
		accessibleRestroom: z.boolean().optional(),
		accessibleParking: z.boolean().optional(),
		stepFreeEntrance: z.boolean().optional(),
		doorAccessibility: z.boolean().optional(),
		tactilePaving: z.boolean().optional(),
		brailleSignage: z.boolean().optional(),
		hearingLoop: z.boolean().optional(),
		accessibilityScore: z.number().int().min(0).max(100).optional(),
		isVerified: z.boolean().optional(),
		additionalInformation: z.string().trim().max(1000).optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field is required",
	});

export {
	CreateCategoryZodSchema,
	LocationListQueryZodSchema,
	UpdateAccessibilityZodSchema,
	UpdateCategoryZodSchema,
	UpdateLocationZodSchema,
	UpdateUserZodSchema,
	UserListQueryZodSchema,
};

export const AdminValidation = {
	AuditLogQueryZodSchema,
	UpdateSettingsZodSchema,
	UserListQueryZodSchema,
	UpdateUserZodSchema,
	CreateCategoryZodSchema,
	UpdateCategoryZodSchema,
	LocationListQueryZodSchema,
	UpdateLocationZodSchema,
	UpdateAccessibilityZodSchema,
};
