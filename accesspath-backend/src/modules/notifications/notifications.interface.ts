import type { z } from "zod";
import type { NotificationListQueryZodSchema } from "./notifications.validation";

export type INotificationListQuery = z.infer<
	typeof NotificationListQueryZodSchema
>;
