import type { Prisma } from "../../prisma/generated/prisma/client";

export const asJson = (value: unknown): Prisma.InputJsonValue =>
	value as Prisma.InputJsonValue;

export const toJson = (value: unknown): Prisma.InputJsonValue | undefined => {
	if (value === undefined || value === null) {
		return undefined;
	}

	return value as Prisma.InputJsonValue;
};
