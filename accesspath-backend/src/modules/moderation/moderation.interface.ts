import type { z } from "zod";
import type {
	ApproveZodSchema,
	FlagZodSchema,
	ModerationHistoryQueryZodSchema,
	ModerationQueueQueryZodSchema,
	RejectZodSchema,
	RequestChangesZodSchema,
	VerifyZodSchema,
} from "./moderation.validation";

export type IApprovePayload = z.infer<typeof ApproveZodSchema>;
export type IRejectPayload = z.infer<typeof RejectZodSchema>;
export type IRequestChangesPayload = z.infer<typeof RequestChangesZodSchema>;
export type IVerifyPayload = z.infer<typeof VerifyZodSchema>;
export type IFlagPayload = z.infer<typeof FlagZodSchema>;
export type IModerationQueueQuery = z.infer<
	typeof ModerationQueueQueryZodSchema
>;
export type IModerationHistoryQuery = z.infer<
	typeof ModerationHistoryQueryZodSchema
>;
