import httpStatus from "http-status";
import z from "zod";
import { AppError } from "./AppError";

export interface IPagination {
	page: number;
	limit: number;
}

export interface IPaginationMeta extends IPagination {
	total: number;
	totalPages: number;
}

export const paginationSchema = z.object({
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

export const parsePagination = (query: unknown): IPagination => {
	const result = paginationSchema.safeParse(query ?? {});

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

export const buildMeta = (
	total: number,
	page: number,
	limit: number,
): IPaginationMeta => ({
	page,
	limit,
	total,
	totalPages: Math.ceil(total / limit),
});

export const getPaginationArgs = ({ page, limit }: IPagination) => ({
	skip: (page - 1) * limit,
	take: limit,
});
