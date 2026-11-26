import type { z } from "zod";
import type {
	AddAttachmentsZodSchema,
	CreateReportZodSchema,
	NearbyQueryZodSchema,
	ReportListQueryZodSchema,
	UpdateReportZodSchema,
} from "./reports.validation";

export type ICreateReportPayload = z.infer<typeof CreateReportZodSchema>;
export type IUpdateReportPayload = z.infer<typeof UpdateReportZodSchema>;
export type IAddAttachmentsPayload = z.infer<typeof AddAttachmentsZodSchema>;
export type IReportListQuery = z.infer<typeof ReportListQueryZodSchema>;
export type INearbyQuery = z.infer<typeof NearbyQueryZodSchema>;
