import httpStatus from "http-status";
import z from "zod";
import { AppError } from "../../utils/AppError";
import type { IPagination } from "./users.interface";

const UpdateMeZodSchema = z
	.object({
		name: z
			.string("Name must be a string")
			.trim()
			.min(2, "Name must be at least 2 characters")
			.max(60, "Name must be at most 60 characters")
			.optional(),
	})
	.strict()
	.refine((data) => Object.keys(data).length > 0, {
		message: "At least one field is required",
	});

const AvatarZodSchema = z
	.object({
		image: z.url("Image must be a valid URL"),
	})
	.strict();

const PaginationZodSchema = z.object({
	page: z.coerce
		.number()
		.int("Page must be an integer")
		.min(1, "Page must be at least 1")
		.default(1),
	limit: z.coerce
		.number()
		.int("Limit must be an integer")
		.min(1, "Limit must be at least 1")
		.max(100, "Limit cannot exceed 100")
		.default(10),
});

const parsePaginationQuery = (query: unknown): IPagination => {
	const result = PaginationZodSchema.safeParse(query ?? {});

	if (!result.success) {
		const issue = result.error.issues[0];
		const field = issue?.path.join(".");

		throw new AppError(
			httpStatus.BAD_REQUEST,
			field
				? `${field}: ${issue?.message}`
				: (issue?.message ?? "Validation failed"),
		);
	}

	return result.data;
};

export type IUpdateMePayload = z.infer<typeof UpdateMeZodSchema>;
export type IAvatarPayload = z.infer<typeof AvatarZodSchema>;

export const UserValidation = {
	UpdateMeZodSchema,
	AvatarZodSchema,
	PaginationZodSchema,
	parsePaginationQuery,
};
