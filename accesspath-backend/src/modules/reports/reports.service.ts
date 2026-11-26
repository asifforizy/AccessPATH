import httpStatus from "http-status";
import type { Prisma } from "../../../prisma/generated/prisma/client";
import {
	type ReportStatus,
	ReportStatus as ReportStatusEnum,
	type ReportType,
	type UserRole,
	UserRole as UserRoleEnum,
} from "../../../prisma/generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import { haversineMeters, roundMeters } from "../../utils/geo";
import {
	buildMeta,
	getPaginationArgs,
	type IPagination,
} from "../../utils/pagination";
import type {
	IAddAttachmentsPayload,
	ICreateReportPayload,
	INearbyQuery,
	IReportListQuery,
	IUpdateReportPayload,
} from "./reports.interface";

const reportInclude = {
	location: {
		select: {
			id: true,
			name: true,
			slug: true,
			city: true,
			country: true,
			latitude: true,
			longitude: true,
		},
	},
	attachments: true,
	reporter: { select: { id: true, name: true, image: true } },
} satisfies Prisma.AccessibilityReportInclude;

const isStaff = (role: UserRole) =>
	role === UserRoleEnum.ADMIN || role === UserRoleEnum.MODERATOR;

const findReport = async (reportId: string) => {
	const report = await prisma.accessibilityReport.findUnique({
		where: { id: reportId },
		include: reportInclude,
	});

	if (!report) {
		throw new AppError(httpStatus.NOT_FOUND, "Report not found");
	}

	return report;
};

const assertCanAccess = (report: { reporterId: string }, user: RequestUser) => {
	if (!isStaff(user.role) && report.reporterId !== user.userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You do not have access to this report",
		);
	}
};

const listReports = async (
	user: RequestUser,
	query: IReportListQuery,
	pagination: IPagination,
) => {
	const where: Prisma.AccessibilityReportWhereInput = {
		...(isStaff(user.role) ? {} : { reporterId: user.userId }),
		...(query.status ? { status: query.status as ReportStatus } : {}),
		...(query.type ? { type: query.type as ReportType } : {}),
		...(query.locationId ? { locationId: query.locationId } : {}),
	};

	const [data, total] = await Promise.all([
		prisma.accessibilityReport.findMany({
			where,
			include: reportInclude,
			orderBy: { createdAt: "desc" },
			...getPaginationArgs(pagination),
		}),
		prisma.accessibilityReport.count({ where }),
	]);

	return {
		data,
		meta: buildMeta(total, pagination.page, pagination.limit),
	};
};

const createReport = async (userId: string, payload: ICreateReportPayload) => {
	const location = await prisma.location.findFirst({
		where: { id: payload.locationId, deletedAt: null },
		select: { id: true },
	});

	if (!location) {
		throw new AppError(httpStatus.NOT_FOUND, "Location not found");
	}

	const report = await prisma.accessibilityReport.create({
		data: {
			locationId: payload.locationId,
			reporterId: userId,
			type: payload.type as ReportType,
			description: payload.description,
			attachments: payload.attachments?.length
				? {
						create: payload.attachments.map((attachment) => ({
							url: attachment.url,
							publicId: attachment.publicId ?? null,
						})),
					}
				: undefined,
		},
		include: reportInclude,
	});

	await prisma.auditLog.create({
		data: {
			action: "REPORT_CREATED",
			entityType: "AccessibilityReport",
			entityId: report.id,
			actorId: userId,
		},
	});

	return report;
};

const getReport = async (user: RequestUser, reportId: string) => {
	const report = await findReport(reportId);
	assertCanAccess(report, user);
	return report;
};

const updateReport = async (
	user: RequestUser,
	reportId: string,
	payload: IUpdateReportPayload,
) => {
	const report = await findReport(reportId);
	assertCanAccess(report, user);

	const staff = isStaff(user.role);

	if (payload.status && !staff) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Only moderators can change the report status",
		);
	}

	if (!staff && report.status !== ReportStatusEnum.PENDING) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Only pending reports can be edited",
		);
	}

	const updated = await prisma.accessibilityReport.update({
		where: { id: reportId },
		data: {
			type: payload.type as ReportType | undefined,
			description: payload.description,
			status: payload.status as ReportStatus | undefined,
			reviewedAt: payload.status && staff ? new Date() : undefined,
		},
		include: reportInclude,
	});

	await prisma.auditLog.create({
		data: {
			action: "REPORT_UPDATED",
			entityType: "AccessibilityReport",
			entityId: reportId,
			actorId: user.userId,
			metadata: payload as Prisma.InputJsonValue,
		},
	});

	return updated;
};

const deleteReport = async (user: RequestUser, reportId: string) => {
	const report = await findReport(reportId);
	assertCanAccess(report, user);

	await prisma.accessibilityReport.delete({ where: { id: reportId } });

	await prisma.auditLog.create({
		data: {
			action: "REPORT_DELETED",
			entityType: "AccessibilityReport",
			entityId: reportId,
			actorId: user.userId,
		},
	});

	return null;
};

const getMyReports = async (user: RequestUser, pagination: IPagination) => {
	const where: Prisma.AccessibilityReportWhereInput = {
		reporterId: user.userId,
	};

	const [data, total] = await Promise.all([
		prisma.accessibilityReport.findMany({
			where,
			include: reportInclude,
			orderBy: { createdAt: "desc" },
			...getPaginationArgs(pagination),
		}),
		prisma.accessibilityReport.count({ where }),
	]);

	return {
		data,
		meta: buildMeta(total, pagination.page, pagination.limit),
	};
};

const getNearbyReports = async (query: INearbyQuery) => {
	const center = {
		latitude: query.latitude,
		longitude: query.longitude,
	};

	const reports = await prisma.accessibilityReport.findMany({
		where: {
			status: {
				in: [ReportStatusEnum.PENDING, ReportStatusEnum.UNDER_REVIEW],
			},
		},
		include: reportInclude,
		take: 500,
	});

	const nearby = reports
		.map((report) => ({
			...report,
			distanceMeters: roundMeters(
				haversineMeters(center, {
					latitude: report.location.latitude,
					longitude: report.location.longitude,
				}),
			),
		}))
		.filter((report) => report.distanceMeters <= query.radiusMeters)
		.sort((a, b) => a.distanceMeters - b.distanceMeters);

	return {
		center,
		radiusMeters: query.radiusMeters,
		total: nearby.length,
		reports: nearby,
	};
};

const getReportHistory = async (user: RequestUser, reportId: string) => {
	const report = await findReport(reportId);
	assertCanAccess(report, user);

	return prisma.auditLog.findMany({
		where: { entityType: "AccessibilityReport", entityId: reportId },
		orderBy: { createdAt: "desc" },
		include: { actor: { select: { id: true, name: true, image: true } } },
	});
};

const addAttachments = async (
	user: RequestUser,
	reportId: string,
	payload: IAddAttachmentsPayload,
) => {
	const report = await findReport(reportId);
	assertCanAccess(report, user);

	await prisma.reportPhoto.createMany({
		data: payload.attachments.map((attachment) => ({
			reportId,
			url: attachment.url,
			publicId: attachment.publicId ?? null,
		})),
	});

	return prisma.reportPhoto.findMany({
		where: { reportId },
		orderBy: { createdAt: "asc" },
	});
};

const getVerification = async (user: RequestUser, reportId: string) => {
	const report = await findReport(reportId);
	assertCanAccess(report, user);

	const [totalReports, resolvedReports] = await Promise.all([
		prisma.accessibilityReport.count({
			where: { locationId: report.locationId },
		}),
		prisma.accessibilityReport.count({
			where: {
				locationId: report.locationId,
				status: ReportStatusEnum.RESOLVED,
			},
		}),
	]);

	return {
		reportId,
		locationId: report.locationId,
		status: report.status,
		totalReportsForLocation: totalReports,
		resolvedReportsForLocation: resolvedReports,
		isVerified:
			report.status === ReportStatusEnum.RESOLVED && resolvedReports >= 2,
		verifiedAt: report.reviewedAt,
	};
};

export const ReportService = {
	listReports,
	createReport,
	getReport,
	updateReport,
	deleteReport,
	getMyReports,
	getNearbyReports,
	getReportHistory,
	addAttachments,
	getVerification,
};
