import httpStatus from "http-status";
import type { Prisma } from "../../../prisma/generated/prisma/client";
import { UserRole, UserStatus } from "../../../prisma/generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import { AppError } from "../../utils/AppError";
import type { IPagination, IPaginationMeta } from "./users.interface";
import type { IAvatarPayload, IUpdateMePayload } from "./users.validation";

const safeUserSelect = {
	id: true,
	name: true,
	email: true,
	image: true,
	emailVerifiedAt: true,
	role: true,
	status: true,
	createdAt: true,
	updatedAt: true,
	preference: true,
	_count: {
		select: {
			createdLocations: true,
			reports: true,
			reviews: true,
			favorites: true,
			savedRoutes: true,
			contributions: true,
		},
	},
} satisfies Prisma.UserSelect;

const SESSION_KEY_PREFIXES = ["refresh-token", "refresh-tokens", "session"];

const userWhereActive = (userId: string): Prisma.UserWhereInput => ({
	id: userId,
	deletedAt: null,
});

const assertActiveUser = async (userId: string) => {
	const user = await prisma.user.findFirst({
		where: userWhereActive(userId),
		select: { id: true, role: true, status: true },
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}
	if (user.status !== UserStatus.ACTIVE) {
		throw new AppError(httpStatus.FORBIDDEN, "User account is not active");
	}

	return user;
};

const clearUserSessions = async (userId: string) => {
	const keys: string[] = [`sessions:${userId}`, `refresh-tokens:${userId}`];

	for (const prefix of SESSION_KEY_PREFIXES) {
		for await (const batch of redisClient.scanIterator({
			MATCH: `${prefix}:*:${userId}`,
			COUNT: 100,
		})) {
			keys.push(...batch);
		}
	}

	if (keys.length > 0) {
		await redisClient.del(keys);
	}
};

const buildMeta = (
	total: number,
	page: number,
	limit: number,
): IPaginationMeta => ({
	page,
	limit,
	total,
	totalPages: Math.ceil(total / limit),
});

const getPaginationArgs = ({ page, limit }: IPagination) => ({
	skip: (page - 1) * limit,
	take: limit,
});

const getMe = async (userId: string) => {
	const user = await prisma.user.findFirst({
		where: userWhereActive(userId),
		select: safeUserSelect,
	});

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}
	if (user.status !== UserStatus.ACTIVE) {
		throw new AppError(httpStatus.FORBIDDEN, "User account is not active");
	}

	return user;
};

const updateMe = async (userId: string, payload: IUpdateMePayload) => {
	await assertActiveUser(userId);

	return prisma.user.update({
		where: { id: userId },
		data: { name: payload.name },
		select: safeUserSelect,
	});
};

const deleteMe = async (userId: string) => {
	const user = await assertActiveUser(userId);

	if (user.role === UserRole.ADMIN) {
		const adminCount = await prisma.user.count({
			where: {
				role: UserRole.ADMIN,
				status: UserStatus.ACTIVE,
				deletedAt: null,
			},
		});

		if (adminCount <= 1) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Cannot delete the only admin account",
			);
		}
	}

	await prisma.user.update({
		where: { id: userId },
		data: { deletedAt: new Date(), status: UserStatus.DELETED },
	});

	try {
		await clearUserSessions(userId);
	} catch (error) {
		console.error("Failed to clear user sessions from Redis:", error);
	}

	return null;
};

const updateAvatar = async (userId: string, payload: IAvatarPayload) => {
	await assertActiveUser(userId);

	return prisma.user.update({
		where: { id: userId },
		data: { image: payload.image },
		select: safeUserSelect,
	});
};

const getMyContributions = async (userId: string, pagination: IPagination) => {
	await assertActiveUser(userId);

	const where: Prisma.ContributionWhereInput = { submittedById: userId };

	const [data, total] = await Promise.all([
		prisma.contribution.findMany({
			where,
			orderBy: { createdAt: "desc" },
			...getPaginationArgs(pagination),
			include: {
				location: { select: { id: true, name: true, slug: true } },
			},
		}),
		prisma.contribution.count({ where }),
	]);

	return { data, meta: buildMeta(total, pagination.page, pagination.limit) };
};

const getMyReports = async (userId: string, pagination: IPagination) => {
	await assertActiveUser(userId);

	const where: Prisma.AccessibilityReportWhereInput = { reporterId: userId };

	const [data, total] = await Promise.all([
		prisma.accessibilityReport.findMany({
			where,
			orderBy: { createdAt: "desc" },
			...getPaginationArgs(pagination),
			include: {
				location: { select: { id: true, name: true, slug: true } },
			},
		}),
		prisma.accessibilityReport.count({ where }),
	]);

	return { data, meta: buildMeta(total, pagination.page, pagination.limit) };
};

const getMyActivity = async (userId: string, pagination: IPagination) => {
	await assertActiveUser(userId);

	const where: Prisma.AuditLogWhereInput = { actorId: userId };

	const [data, total] = await Promise.all([
		prisma.auditLog.findMany({
			where,
			orderBy: { createdAt: "desc" },
			...getPaginationArgs(pagination),
		}),
		prisma.auditLog.count({ where }),
	]);

	return { data, meta: buildMeta(total, pagination.page, pagination.limit) };
};

export const UsersService = {
	safeUserSelect,
	getMe,
	updateMe,
	deleteMe,
	updateAvatar,
	getMyContributions,
	getMyReports,
	getMyActivity,
};
