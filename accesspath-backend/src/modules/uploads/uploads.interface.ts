import type { z } from "zod";
import type {
	PresignedUrlZodSchema,
	UploadImageZodSchema,
	UploadMultipleZodSchema,
} from "./uploads.validation";

export type IUploadImagePayload = z.infer<typeof UploadImageZodSchema>;
export type IUploadMultiplePayload = z.infer<typeof UploadMultipleZodSchema>;
export type IPresignedUrlPayload = z.infer<typeof PresignedUrlZodSchema>;
