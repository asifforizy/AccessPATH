import type { z } from "zod";
import type {
	AuditLogQueryZodSchema,
	UpdateSettingsZodSchema,
} from "./admin.validation";

export type IAuditLogQuery = z.infer<typeof AuditLogQueryZodSchema>;
export type IUpdateSettingsPayload = z.infer<typeof UpdateSettingsZodSchema>;

export interface IAdminSettings {
	siteName: string;
	supportEmail: string;
	maintenanceMode: boolean;
	allowRegistrations: boolean;
	defaultPageSize: number;
	maxUploadSizeMb: number;
	features: Record<string, boolean>;
	updatedAt: string;
}
