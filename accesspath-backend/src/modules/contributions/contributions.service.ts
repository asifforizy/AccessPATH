import httpStatus from "http-status";
import type { Prisma } from "../../../prisma/generated/prisma/client";
import {
	type ContributionStatus,
	ContributionStatus as ContributionStatusEnum,
	type ContributionType,
	type UserRole,
	UserRole as UserRoleEnum,
} from "../../../prisma/generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import { asJson } from "../../utils/json";
import {
	buildMeta,
	getPaginationArgs,
	type IPagination,
} from "../../utils/pagination";
import type {
	IContributionListQuery,
	ICreateContributionPayload,
	IUpdateContributionPayload,
} from "./contributions.interface";

const contributionInclude = {
	location: { select: { id: true, name: true, slug: true, city: true } },
	submittedBy: { select: { id: true, name: true, image: true } },
	reviewedBy: { select: { id: true, name: true, image: true } },
} satisfies Prisma.ContributionInclude;

const isStaff = (role: UserRole) =>
	role === UserRoleEnum.ADMIN || role === UserRoleEnum.MODERATOR;

const findContribution = async (contributionId: string) => {
	const contribution = await prisma.contribution.findUnique({
		where: { id: contributionId },
		include: contributionInclude,
	});

	if (!contribution) {
		throw new AppError(httpStatus.NOT_FOUND, "Contribution not found");
	}

	return contribution;
};

const assertCanAccess = (
	contribution: { submittedById: string },
	user: RequestUser,
) => {
	if (!isStaff(user.role) && contribution.submittedById !== user.userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You do not have access to this contribution",
		);
	}
};

const listContributions = async (
	user: RequestUser,
	query: IContributionListQuery,
	pagination: IPagination,
) => {
	const where: Prisma.ContributionWhereInput = {
		...(isStaff(user.role) ? {} : { submittedById: user.userId }),
		...(query.status ? { status: query.status as ContributionStatus } : {}),
		...(query.type ? { type: query.type as ContributionType } : {}),
		...(query.locationId ? { locationId: query.locationId } : {}),
	};

	const [data, total] = await Promise.all([
		prisma.contribution.findMany({
			where,
			include: contributionInclude,
			orderBy: { createdAt: "desc" },
			...getPaginationArgs(pagination),
		}),
		prisma.contribution.count({ where }),
	]);

	return {
		data,
		meta: buildMeta(total, pagination.page, pagination.limit),
	};
};

const createContribution = async (
	userId: string,
	payload: ICreateContributionPayload,
) => {
	if (payload.locationId) {
		const location = await prisma.location.findFirst({
			where: { id: payload.locationId, deletedAt: null },
			select: { id: true },
		});

		if (!location) {
			throw new AppError(httpStatus.NOT_FOUND, "Location not found");
		}
	}

	const contribution = await prisma.contribution.create({
		data: {
			type: payload.type as ContributionType,
			title: payload.title ?? null,
			description: payload.description ?? null,
			proposedData: asJson(payload.proposedData),
			locationId: payload.locationId ?? null,
			submittedById: userId,
		},
		include: contributionInclude,
	});

	await prisma.auditLog.create({
		data: {
			action: "CONTRIBUTION_CREATED",
			entityType: "Contribution",
			entityId: contribution.id,
			actorId: userId,
		},
	});

	return contribution;
};

const getContribution = async (user: RequestUser, contributionId: string) => {
	const contribution = await findContribution(contributionId);
	assertCanAccess(contribution, user);
	return contribution;
};

const updateContribution = async (
	user: RequestUser,
	contributionId: string,
	payload: IUpdateContributionPayload,
) => {
	const contribution = await findContribution(contributionId);
	assertCanAccess(contribution, user);

	if (contribution.status !== ContributionStatusEnum.PENDING) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Only pending contributions can be edited",
		);
	}

	const updated = await prisma.contribution.update({
		where: { id: contributionId },
		data: {
			title: payload.title,
			description: payload.description,
			proposedData: payload.proposedData
				? asJson(payload.proposedData)
				: undefined,
		},
		include: contributionInclude,
	});

	await prisma.auditLog.create({
		data: {
			action: "CONTRIBUTION_UPDATED",
			entityType: "Contribution",
			entityId: contributionId,
			actorId: user.userId,
		},
	});

	return updated;
};

const deleteContribution = async (
	user: RequestUser,
	contributionId: string,
) => {
	const contribution = await findContribution(contributionId);
	assertCanAccess(contribution, user);

	if (
		contribution.status !== ContributionStatusEnum.PENDING &&
		user.role !== UserRoleEnum.ADMIN
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Only pending contributions can be deleted",
		);
	}

	await prisma.contribution.delete({ where: { id: contributionId } });

	await prisma.auditLog.create({
		data: {
			action: "CONTRIBUTION_DELETED",
			entityType: "Contribution",
			entityId: contributionId,
			actorId: user.userId,
		},
	});

	return null;
};

const getMyContributions = async (
	user: RequestUser,
	pagination: IPagination,
) => {
	const where: Prisma.ContributionWhereInput = {
		submittedById: user.userId,
	};

	const [data, total] = await Promise.all([
		prisma.contribution.findMany({
			where,
			include: contributionInclude,
			orderBy: { createdAt: "desc" },
			...getPaginationArgs(pagination),
		}),
		prisma.contribution.count({ where }),
	]);

	return {
		data,
		meta: buildMeta(total, pagination.page, pagination.limit),
	};
};

const getStatistics = async (user: RequestUser) => {
	const where: Prisma.ContributionWhereInput = isStaff(user.role)
		? {}
		: { submittedById: user.userId };

	const [total, byStatusRaw, byTypeRaw] = await Promise.all([
		prisma.contribution.count({ where }),
		prisma.contribution.groupBy({
			by: ["status"],
			where,
			_count: { _all: true },
		}),
		prisma.contribution.groupBy({
			by: ["type"],
			where,
			_count: { _all: true },
		}),
	]);

	const byStatus: Record<string, number> = {};
	for (const group of byStatusRaw) {
		byStatus[group.status] = group._count._all;
	}

	const byType: Record<string, number> = {};
	for (const group of byTypeRaw) {
		byType[group.type] = group._count._all;
	}

	return { total, byStatus, byType };
};

const getContributionHistory = async (
	user: RequestUser,
	contributionId: string,
) => {
	const contribution = await findContribution(contributionId);
	assertCanAccess(contribution, user);

	return prisma.auditLog.findMany({
		where: { entityType: "Contribution", entityId: contributionId },
		orderBy: { createdAt: "desc" },
		include: { actor: { select: { id: true, name: true, image: true } } },
	});
};

export const ContributionService = {
	listContributions,
	createContribution,
	getContribution,
	updateContribution,
	deleteContribution,
	getMyContributions,
	getStatistics,
	getContributionHistory,
};
