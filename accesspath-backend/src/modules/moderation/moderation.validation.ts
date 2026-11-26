import z from "zod";

const ApproveZodSchema = z.object({
	note: z.string().trim().max(1_000).optional(),
});

const RejectZodSchema = z.object({
	note: z.string().trim().min(3).max(1_000),
});

const RequestChangesZodSchema = z.object({
	note: z.string().trim().min(3).max(1_000),
});

const VerifyZodSchema = z.object({
	note: z.string().trim().max(1_000).optional(),
});

const FlagZodSchema = z.object({
	reason: z.string().trim().min(3).max(500),
});

const ModerationQueueQueryZodSchema = z.object({
	status: z
		.enum(["PENDING", "UNDER_REVIEW", "RESOLVED", "REJECTED"])
		.optional(),
});

const ModerationHistoryQueryZodSchema = z.object({
	action: z.string().trim().max(80).optional(),
	entityType: z.string().trim().max(80).optional(),
});

export {
	ApproveZodSchema,
	FlagZodSchema,
	ModerationHistoryQueryZodSchema,
	ModerationQueueQueryZodSchema,
	RejectZodSchema,
	RequestChangesZodSchema,
	VerifyZodSchema,
};

export const ModerationValidation = {
	ApproveZodSchema,
	RejectZodSchema,
	RequestChangesZodSchema,
	VerifyZodSchema,
	FlagZodSchema,
	ModerationQueueQueryZodSchema,
	ModerationHistoryQueryZodSchema,
};
