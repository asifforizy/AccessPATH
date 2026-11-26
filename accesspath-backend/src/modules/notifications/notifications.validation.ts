import z from "zod";

const NotificationListQueryZodSchema = z.object({
	isRead: z
		.enum(["true", "false"])
		.transform((value) => value === "true")
		.optional(),
});

export { NotificationListQueryZodSchema };

export const NotificationValidation = {
	NotificationListQueryZodSchema,
};
