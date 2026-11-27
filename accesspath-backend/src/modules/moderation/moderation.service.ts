import httpStatus from "http-status";
import type { Prisma } from "../../../prisma/generated/prisma/client";
import {
	ContributionStatus,
	type ContributionType,
	LocationStatus,
	ReportStatus,
	type ReportStatus as ReportStatusType,
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
import { slugify } from "../../utils/slug";
import type {
	IApprovePayload,
	IFlagPayload,
	IModerationHistoryQuery,
	IRejectPayload,
	IRequestChangesPayload,
	IVerifyPayload,
} from "./moderation.interface";

const BOOLEAN_PROFILE_KEYS = [
	"wheelchairAccessible",
	"rampAvailable",
	"elevatorAvailable",
	"accessibleRestroom",
	"accessibleParking",
	"stepFreeEntrance",
	"doorAccessibility",
	"tactilePaving",
	"brailleSignage",
	"hearingLoop",
] as const;

const LOCATION_STRING_KEYS = [
	"name",
	"description",
	"address",
	"city",
	"state",
	"country",
	"postalCode",
	"phone",
	"website",
] as const;

const isAdmin = (role: UserRole) => role === UserRoleEnum.ADMIN;

/**
 * Data-integrity guard: nobody may review their own submission, including
 * moderators and admins. (Contributors are already blocked by role.)
 */
const assertNotSelfReview = (
	reviewer: RequestUser,
	submission: Awaited<ReturnType<typeof findSubmission>>,
) => {
	const ownerId =
		submission.kind === "contribution"
			? submission.data.submittedById
			: submission.kind === "report"
				? submission.data.reporterId
				: submission.data.createdById;

	if (ownerId && ownerId === reviewer.userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You cannot review or verify your own submission. Ask another moderator.",
		);
	}
};

const findSubmission = async (submissionId: string) => {
	const contribution = await prisma.contribution.findUnique({
		where: { id: submissionId },
		include: {
			location: { select: { id: true, name: true, slug: true } },
			submittedBy: { select: { id: true, name: true, email: true } },
		},
	});

	if (contribution) {
		return { kind: "contribution" as const, data: contribution };
	}

	const report = await prisma.accessibilityReport.findUnique({
		where: { id: submissionId },
		include: {
			location: { select: { id: true, name: true, slug: true } },
			reporter: { select: { id: true, name: true, email: true } },
			attachments: true,
		},
	});

	if (report) {
		return { kind: "report" as const, data: report };
	}

	const location = await prisma.location.findUnique({
		where: { id: submissionId },
		include: {
			category: { select: { id: true, name: true } },
			createdBy: { select: { id: true, name: true, email: true } },
			accessibility: true,
		},
	});

	if (location) {
		return { kind: "location" as const, data: location };
	}

	throw new AppError(httpStatus.NOT_FOUND, "Submission not found");
};

const uniqueSlug = async (name: string) => {
	const base = slugify(name) || `location-${Date.now()}`;
	const existing = await prisma.location.findUnique({
		where: { slug: base },
		select: { id: true },
	});

	if (!existing) {
		return base;
	}

	return `${base}-${Date.now().toString(36)}`;
};

const applyContribution = async (
	contribution: {
		id: string;
		type: ContributionType;
		locationId: string | null;
		proposedData: Prisma.JsonValue;
	},
	reviewerId: string,
) => {
	const data =
		contribution.proposedData &&
		typeof contribution.proposedData === "object" &&
		!Array.isArray(contribution.proposedData)
			? (contribution.proposedData as Record<string, unknown>)
			: {};

	if (contribution.type === "LOCATION_CREATE") {
		const name = typeof data.name === "string" ? data.name : null;
		const address = typeof data.address === "string" ? data.address : null;
		const city = typeof data.city === "string" ? data.city : null;
		const country = typeof data.country === "string" ? data.country : null;
		const categoryId =
			typeof data.categoryId === "string" ? data.categoryId : null;
		const latitude = Number(data.latitude);
		const longitude = Number(data.longitude);

		if (
			name &&
			address &&
			city &&
			country &&
			categoryId &&
			Number.isFinite(latitude) &&
			Number.isFinite(longitude)
		) {
			const location = await prisma.location.create({
				data: {
					name,
					slug: await uniqueSlug(name),
					description:
						typeof data.description === "string" ? data.description : null,
					address,
					city,
					state: typeof data.state === "string" ? data.state : null,
					country,
					postalCode:
						typeof data.postalCode === "string" ? data.postalCode : null,
					latitude,
					longitude,
					phone: typeof data.phone === "string" ? data.phone : null,
					website: typeof data.website === "string" ? data.website : null,
					categoryId,
					createdById: reviewerId,
					status: LocationStatus.APPROVED,
				},
			});

			// Preserve the accessibility data submitted with the new location.
			const features =
				data.features && typeof data.features === "object"
					? (data.features as Record<string, unknown>)
					: null;

			const profileData: Record<string, boolean> = {};
			for (const key of BOOLEAN_PROFILE_KEYS) {
				if (features?.[key] === true) profileData[key] = true;
			}

			if (Object.keys(profileData).length > 0) {
				await prisma.accessibilityProfile.create({
					data: {
						locationId: location.id,
						...profileData,
						accessibilityScore:
							typeof data.accessibilityScore === "number"
								? Math.min(
										100,
										Math.max(0, Math.round(data.accessibilityScore)),
									)
								: 0,
						additionalInformation:
							typeof data.additionalInformation === "string"
								? data.additionalInformation
								: null,
					},
				});
			}

			if (typeof data.photoUrl === "string" && data.photoUrl.length > 0) {
				await prisma.locationPhoto.create({
					data: {
						locationId: location.id,
						url: data.photoUrl,
						uploadedById: reviewerId,
						isPrimary: true,
					},
				});
			}

			await prisma.contribution.update({
				where: { id: contribution.id },
				data: { locationId: location.id },
			});
		}

		return;
	}

	if (!contribution.locationId) {
		return;
	}

	if (contribution.type === "ACCESSIBILITY_UPDATE") {
		const profileData: Record<string, boolean> = {};

		for (const key of BOOLEAN_PROFILE_KEYS) {
			if (typeof data[key] === "boolean") {
				profileData[key] = data[key];
			}
		}

		await prisma.accessibilityProfile.upsert({
			where: { locationId: contribution.locationId },
			update: profileData as Prisma.AccessibilityProfileUpdateInput,
			create: {
				locationId: contribution.locationId,
				...(profileData as Record<string, boolean>),
			},
		});

		await prisma.accessibilityHistory.create({
			data: {
				locationId: contribution.locationId,
				snapshot: asJson(data),
				changedById: reviewerId,
			},
		});

		return;
	}

	const update: Prisma.LocationUpdateInput = {};

	for (const key of LOCATION_STRING_KEYS) {
		if (typeof data[key] === "string") {
			(update as Record<string, unknown>)[key] = data[key];
		}
	}

	if (Number.isFinite(Number(data.latitude))) {
		update.latitude = Number(data.latitude);
	}
	if (Number.isFinite(Number(data.longitude))) {
		update.longitude = Number(data.longitude);
	}

	if (Object.keys(update).length > 0) {
		await prisma.location.update({
			where: { id: contribution.locationId },
			data: update,
		});
	}
};

const getQueue = async (pagination: IPagination) => {
	const contributionWhere: Prisma.ContributionWhereInput = {
		status: ContributionStatus.PENDING,
	};
	const reportWhere: Prisma.AccessibilityReportWhereInput = {
		status: { in: [ReportStatus.PENDING, ReportStatus.UNDER_REVIEW] },
	};
	const locationWhere: Prisma.LocationWhereInput = {
		status: LocationStatus.PENDING,
		deletedAt: null,
	};

	const [
		contributions,
		reports,
		locations,
		contributionCount,
		reportCount,
		locationCount,
	] = await Promise.all([
		prisma.contribution.findMany({
			where: contributionWhere,
			orderBy: { createdAt: "asc" },
			...getPaginationArgs(pagination),
		}),
		prisma.accessibilityReport.findMany({
			where: reportWhere,
			orderBy: { createdAt: "asc" },
			...getPaginationArgs(pagination),
		}),
		prisma.location.findMany({
			where: locationWhere,
			orderBy: { createdAt: "asc" },
			...getPaginationArgs(pagination),
		}),
		prisma.contribution.count({ where: contributionWhere }),
		prisma.accessibilityReport.count({ where: reportWhere }),
		prisma.location.count({ where: locationWhere }),
	]);

	return {
		contributions,
		reports,
		locations,
		counts: {
			contributions: contributionCount,
			reports: reportCount,
			locations: locationCount,
			total: contributionCount + reportCount + locationCount,
		},
		meta: buildMeta(
			contributionCount + reportCount + locationCount,
			pagination.page,
			pagination.limit,
		),
	};
};

const getLocations = async (
	status: LocationStatus | undefined,
	pagination: IPagination,
) => {
	const where: Prisma.LocationWhereInput = {
		deletedAt: null,
		...(status ? { status } : {}),
	};

	const [data, total] = await Promise.all([
		prisma.location.findMany({
			where,
			orderBy: { createdAt: "desc" },
			...getPaginationArgs(pagination),
			include: {
				category: { select: { id: true, name: true } },
				createdBy: { select: { id: true, name: true } },
				accessibility: true,
			},
		}),
		prisma.location.count({ where }),
	]);

	return {
		data,
		meta: buildMeta(total, pagination.page, pagination.limit),
	};
};

const getReports = async (
	status: ReportStatusType | undefined,
	pagination: IPagination,
) => {
	const where: Prisma.AccessibilityReportWhereInput = status ? { status } : {};

	const [data, total] = await Promise.all([
		prisma.accessibilityReport.findMany({
			where,
			orderBy: { createdAt: "desc" },
			...getPaginationArgs(pagination),
			include: {
				location: { select: { id: true, name: true, slug: true } },
				reporter: { select: { id: true, name: true } },
				attachments: true,
			},
		}),
		prisma.accessibilityReport.count({ where }),
	]);

	return {
		data,
		meta: buildMeta(total, pagination.page, pagination.limit),
	};
};

const getContributions = async (
	status: ContributionStatus | undefined,
	pagination: IPagination,
) => {
	const where: Prisma.ContributionWhereInput = status ? { status } : {};

	const [data, total] = await Promise.all([
		prisma.contribution.findMany({
			where,
			orderBy: { createdAt: "desc" },
			...getPaginationArgs(pagination),
			include: {
				location: { select: { id: true, name: true, slug: true } },
				submittedBy: { select: { id: true, name: true } },
			},
		}),
		prisma.contribution.count({ where }),
	]);

	return {
		data,
		meta: buildMeta(total, pagination.page, pagination.limit),
	};
};

const getFeedback = async (pagination: IPagination) => {
	const [data, total] = await Promise.all([
		prisma.review.findMany({
			orderBy: { createdAt: "desc" },
			...getPaginationArgs(pagination),
			include: {
				user: { select: { id: true, name: true, image: true } },
				location: { select: { id: true, name: true, slug: true } },
				_count: { select: { helpfulVotes: true } },
			},
		}),
		prisma.review.count(),
	]);

	return {
		data,
		meta: buildMeta(total, pagination.page, pagination.limit),
	};
};

const getSubmission = async (submissionId: string) =>
	findSubmission(submissionId);

const approveSubmission = async (
	reviewer: RequestUser,
	submissionId: string,
	payload: IApprovePayload,
) => {
	const submission = await findSubmission(submissionId);

	assertNotSelfReview(reviewer, submission);

	if (submission.kind === "contribution") {
		if (submission.data.status !== ContributionStatus.PENDING) {
			throw new AppError(httpStatus.BAD_REQUEST, "Contribution is not pending");
		}

		await applyContribution(submission.data, reviewer.userId);

		await prisma.contribution.update({
			where: { id: submissionId },
			data: {
				status: ContributionStatus.APPROVED,
				reviewedById: reviewer.userId,
				reviewedAt: new Date(),
				reviewNote: payload.note ?? null,
			},
		});
	} else if (submission.kind === "report") {
		await prisma.accessibilityReport.update({
			where: { id: submissionId },
			data: { status: ReportStatus.RESOLVED, reviewedAt: new Date() },
		});
	} else {
		await prisma.location.update({
			where: { id: submissionId },
			data: { status: LocationStatus.APPROVED },
		});
	}

	await prisma.auditLog.create({
		data: {
			action: "SUBMISSION_APPROVED",
			entityType: submission.kind,
			entityId: submissionId,
			actorId: reviewer.userId,
			metadata: payload.note ? { note: payload.note } : undefined,
		},
	});

	return findSubmission(submissionId);
};

const rejectSubmission = async (
	reviewer: RequestUser,
	submissionId: string,
	payload: IRejectPayload,
) => {
	const submission = await findSubmission(submissionId);

	assertNotSelfReview(reviewer, submission);

	if (submission.kind === "contribution") {
		await prisma.contribution.update({
			where: { id: submissionId },
			data: {
				status: ContributionStatus.REJECTED,
				reviewedById: reviewer.userId,
				reviewedAt: new Date(),
				reviewNote: payload.note,
			},
		});
	} else if (submission.kind === "report") {
		await prisma.accessibilityReport.update({
			where: { id: submissionId },
			data: { status: ReportStatus.REJECTED, reviewedAt: new Date() },
		});
	} else {
		await prisma.location.update({
			where: { id: submissionId },
			data: { status: LocationStatus.REJECTED },
		});
	}

	await prisma.auditLog.create({
		data: {
			action: "SUBMISSION_REJECTED",
			entityType: submission.kind,
			entityId: submissionId,
			actorId: reviewer.userId,
			metadata: { note: payload.note },
		},
	});

	return findSubmission(submissionId);
};

const requestChanges = async (
	reviewer: RequestUser,
	submissionId: string,
	payload: IRequestChangesPayload,
) => {
	const submission = await findSubmission(submissionId);

	assertNotSelfReview(reviewer, submission);

	if (submission.kind === "contribution") {
		await prisma.contribution.update({
			where: { id: submissionId },
			data: {
				reviewedById: reviewer.userId,
				reviewNote: payload.note,
			},
		});
	} else if (submission.kind === "report") {
		await prisma.accessibilityReport.update({
			where: { id: submissionId },
			data: { status: ReportStatus.UNDER_REVIEW },
		});
	}

	await prisma.auditLog.create({
		data: {
			action: "SUBMISSION_CHANGES_REQUESTED",
			entityType: submission.kind,
			entityId: submissionId,
			actorId: reviewer.userId,
			metadata: { note: payload.note },
		},
	});

	return findSubmission(submissionId);
};

const verifySubmission = async (
	reviewer: RequestUser,
	submissionId: string,
	payload: IVerifyPayload,
) => {
	const submission = await findSubmission(submissionId);

	assertNotSelfReview(reviewer, submission);

	if (submission.kind === "location") {
		await prisma.accessibilityProfile.upsert({
			where: { locationId: submissionId },
			update: { isVerified: true, verifiedAt: new Date() },
			create: {
				locationId: submissionId,
				isVerified: true,
				verifiedAt: new Date(),
			},
		});
	} else if (submission.kind === "report") {
		await prisma.accessibilityReport.update({
			where: { id: submissionId },
			data: { status: ReportStatus.RESOLVED, reviewedAt: new Date() },
		});
	}

	await prisma.auditLog.create({
		data: {
			action: "SUBMISSION_VERIFIED",
			entityType: submission.kind,
			entityId: submissionId,
			actorId: reviewer.userId,
			metadata: payload.note ? { note: payload.note } : undefined,
		},
	});

	return findSubmission(submissionId);
};

const flagSubmission = async (
	reviewer: RequestUser,
	submissionId: string,
	payload: IFlagPayload,
) => {
	const submission = await findSubmission(submissionId);

	assertNotSelfReview(reviewer, submission);

	const log = await prisma.auditLog.create({
		data: {
			action: "SUBMISSION_FLAGGED",
			entityType: submission.kind,
			entityId: submissionId,
			actorId: reviewer.userId,
			metadata: { reason: payload.reason },
		},
	});

	return {
		submissionId,
		kind: submission.kind,
		flagged: true,
		reason: payload.reason,
		flagId: log.id,
		createdAt: log.createdAt,
	};
};

const getHistory = async (
	query: IModerationHistoryQuery,
	pagination: IPagination,
) => {
	const where: Prisma.AuditLogWhereInput = {
		...(query.action ? { action: query.action } : {}),
		...(query.entityType ? { entityType: query.entityType } : {}),
	};

	const [data, total] = await Promise.all([
		prisma.auditLog.findMany({
			where,
			orderBy: { createdAt: "desc" },
			...getPaginationArgs(pagination),
			include: { actor: { select: { id: true, name: true, image: true } } },
		}),
		prisma.auditLog.count({ where }),
	]);

	return {
		data,
		meta: buildMeta(total, pagination.page, pagination.limit),
	};
};

const getStatistics = async () => {
	const [
		contributionsByStatus,
		reportsByStatus,
		locationsByStatus,
		totalReviews,
		totalFlags,
	] = await Promise.all([
		prisma.contribution.groupBy({
			by: ["status"],
			_count: { _all: true },
		}),
		prisma.accessibilityReport.groupBy({
			by: ["status"],
			_count: { _all: true },
		}),
		prisma.location.groupBy({
			by: ["status"],
			_count: { _all: true },
		}),
		prisma.review.count(),
		prisma.auditLog.count({ where: { action: "SUBMISSION_FLAGGED" } }),
	]);

	const toRecord = <T extends string>(
		groups: { _count: { _all: number } }[],
		key: (group: { _count: { _all: number } }) => T,
	) => {
		const result: Record<string, number> = {};
		for (const group of groups) {
			result[key(group)] = group._count._all;
		}
		return result;
	};

	return {
		contributions: {
			byStatus: toRecord(
				contributionsByStatus,
				(group) => (group as unknown as { status: string }).status,
			),
			total: contributionsByStatus.reduce(
				(sum, group) => sum + group._count._all,
				0,
			),
		},
		reports: {
			byStatus: toRecord(
				reportsByStatus,
				(group) => (group as unknown as { status: string }).status,
			),
			total: reportsByStatus.reduce((sum, group) => sum + group._count._all, 0),
		},
		locations: {
			byStatus: toRecord(
				locationsByStatus,
				(group) => (group as unknown as { status: string }).status,
			),
			total: locationsByStatus.reduce(
				(sum, group) => sum + group._count._all,
				0,
			),
		},
		totalReviews,
		totalFlags,
	};
};

export const ModerationService = {
	getQueue,
	getLocations,
	getReports,
	getContributions,
	getFeedback,
	getSubmission,
	approveSubmission,
	rejectSubmission,
	requestChanges,
	verifySubmission,
	flagSubmission,
	getHistory,
	getStatistics,
	isAdmin,
};
