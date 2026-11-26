import httpStatus from "http-status";
import type { z } from "zod";
import { AppError } from "./AppError";

export const parseQuery = <T>(schema: z.ZodType<T>, query: unknown): T => {
	const result = schema.safeParse(query ?? {});

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
