import httpStatus from "http-status";
import type { Prisma } from "../../../prisma/generated/prisma/client";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import {
	buildMeta,
	getPaginationArgs,
	type IPagination,
} from "../../utils/pagination";
import type {
	ICreateFeedbackPayload,
	ICreateLocationReviewPayload,
	IFeedbackListQuery,
	IFlagFeedbackPayload,
	IUpdateFeedbackPayload,
} from "./feedback.interface";

const feedbackInclude = {
	user: { select: { id: true, name: true, image: true } },
	location: { select: { id: true, name: true, slug: true, city: true } },
	_count: { select: { helpfulVotes: true } },
} satisfies Prisma.ReviewInclude;

const findFeedback = async (feedbackId: string) => {
	const feedback = await prisma.review.findUnique({
		where: { id: feedbackId },
		include: feedbackInclude,
	});

	if (!feedback) {
		throw new AppError(httpStatus.NOT_FOUND, "Feedback not found");
	}

	return feedback;
};

const assertOwnerOrAdmin = (
	feedback: { userId: string },
	user: RequestUser,
) => {
	if (feedback.userId !== user.userId && user.role !== UserRole.ADMIN) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You do not have access to this feedback",
		);
	}
};

const listFeedback = async (
	query: IFeedbackListQuery,
	pagination: IPagination,
) => {
	const where: Prisma.ReviewWhereInput = {
		...(query.locationId ? { locationId: query.locationId } : {}),
		...(query.userId ? { userId: query.userId } : {}),
	};

	const [data, total] = await Promise.all([
		prisma.review.findMany({
			where,
			include: feedbackInclude,
			orderBy: { createdAt: "desc" },
			...getPaginationArgs(pagination),
		}),
		prisma.review.count({ where }),
	]);

	return {
		data,
		meta: buildMeta(total, pagination.page, pagination.limit),
	};
};

const assertLocationExists = async (locationId: string) => {
	const location = await prisma.location.findFirst({
		where: { id: locationId, deletedAt: null },
		select: { id: true },
	});

	if (!location) {
		throw new AppError(httpStatus.NOT_FOUND, "Location not found");
	}
};

const createFeedback = async (
	userId: string,
	payload: ICreateFeedbackPayload,
) => {
	await assertLocationExists(payload.locationId);

	return prisma.review.create({
		data: {
			userId,
			locationId: payload.locationId,
			rating: payload.rating,
			comment: payload.comment ?? null,
		},
		include: feedbackInclude,
	});
};

const getFeedback = async (feedbackId: string) => findFeedback(feedbackId);

const updateFeedback = async (
	user: RequestUser,
	feedbackId: string,
	payload: IUpdateFeedbackPayload,
) => {
	const feedback = await findFeedback(feedbackId);
	assertOwnerOrAdmin(feedback, user);

	return prisma.review.update({
		where: { id: feedbackId },
		data: {
			rating: payload.rating,
			comment: payload.comment,
		},
		include: feedbackInclude,
	});
};

const deleteFeedback = async (user: RequestUser, feedbackId: string) => {
	const feedback = await findFeedback(feedbackId);
	assertOwnerOrAdmin(feedback, user);

	await prisma.review.delete({ where: { id: feedbackId } });

	await prisma.auditLog.create({
		data: {
			action: "FEEDBACK_DELETED",
			entityType: "Review",
			entityId: feedbackId,
			actorId: user.userId,
		},
	});

	return null;
};

const getLocationFeedback = async (locationId: string) => {
	await assertLocationExists(locationId);

	const groups = await prisma.review.groupBy({
		by: ["rating"],
		where: { locationId },
		_count: { _all: true },
	});

	const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
	let total = 0;
	let sum = 0;

	for (const group of groups) {
		distribution[group.rating] = group._count._all;
		total += group._count._all;
		sum += group.rating * group._count._all;
	}

	return {
		locationId,
		total,
		averageRating: total > 0 ? Number((sum / total).toFixed(2)) : 0,
		distribution,
	};
};

const getLocationReviews = async (
	locationId: string,
	pagination: IPagination,
) => {
	await assertLocationExists(locationId);

	const where: Prisma.ReviewWhereInput = { locationId };

	const [data, total] = await Promise.all([
		prisma.review.findMany({
			where,
			include: feedbackInclude,
			orderBy: { createdAt: "desc" },
			...getPaginationArgs(pagination),
		}),
		prisma.review.count({ where }),
	]);

	return {
		data,
		meta: buildMeta(total, pagination.page, pagination.limit),
	};
};

const createLocationReview = async (
	userId: string,
	locationId: string,
	payload: ICreateLocationReviewPayload,
) => {
	await assertLocationExists(locationId);

	return prisma.review.create({
		data: {
			userId,
			locationId,
			rating: payload.rating,
			comment: payload.comment ?? null,
		},
		include: feedbackInclude,
	});
};

const flagFeedback = async (
	user: RequestUser,
	feedbackId: string,
	payload: IFlagFeedbackPayload,
) => {
	await findFeedback(feedbackId);

	const log = await prisma.auditLog.create({
		data: {
			action: "FEEDBACK_FLAGGED",
			entityType: "Review",
			entityId: feedbackId,
			actorId: user.userId,
			metadata: { reason: payload.reason },
		},
	});

	return {
		feedbackId,
		flagged: true,
		reason: payload.reason,
		flagId: log.id,
		createdAt: log.createdAt,
	};
};

const markHelpful = async (userId: string, feedbackId: string) => {
	await findFeedback(feedbackId);

	const existing = await prisma.reviewHelpful.findUnique({
		where: {
			reviewId_userId: { reviewId: feedbackId, userId },
		},
	});

	if (existing) {
		await prisma.reviewHelpful.delete({ where: { id: existing.id } });
	} else {
		await prisma.reviewHelpful.create({
			data: { reviewId: feedbackId, userId },
		});
	}

	const count = await prisma.reviewHelpful.count({
		where: { reviewId: feedbackId },
	});

	return { feedbackId, helpful: !existing, count };
};

export const FeedbackService = {
	listFeedback,
	createFeedback,
	getFeedback,
	updateFeedback,
	deleteFeedback,
	getLocationFeedback,
	getLocationReviews,
	createLocationReview,
	flagFeedback,
	markHelpful,
};
