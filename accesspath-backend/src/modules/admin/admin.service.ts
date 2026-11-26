import type { Prisma } from "../../../prisma/generated/prisma/client";
import {
	ContributionStatus,
	LocationStatus,
	ReportStatus,
} from "../../../prisma/generated/prisma/enums";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import {
	buildMeta,
	getPaginationArgs,
	type IPagination,
} from "../../utils/pagination";
import type {
	IAdminSettings,
	IAuditLogQuery,
	IUpdateSettingsPayload,
} from "./admin.interface";

let settings: IAdminSettings = {
	siteName: "AccessPath",
	supportEmail: "support@accesspath.app",
	maintenanceMode: false,
	allowRegistrations: true,
	defaultPageSize: 20,
	maxUploadSizeMb: 10,
	features: {
		reviews: true,
		contributions: true,
		notifications: true,
		analytics: true,
	},
	updatedAt: new Date().toISOString(),
};

const getStats = async () => {
	const [
		users,
		locations,
		reports,
		contributions,
		reviews,
		favorites,
		categories,
		notifications,
		auditLogs,
		pendingLocations,
		pendingReports,
		pendingContributions,
	] = await Promise.all([
		prisma.user.count({ where: { deletedAt: null } }),
		prisma.location.count({ where: { deletedAt: null } }),
		prisma.accessibilityReport.count(),
		prisma.contribution.count(),
		prisma.review.count(),
		prisma.favorite.count(),
		prisma.category.count(),
		prisma.notification.count(),
		prisma.auditLog.count(),
		prisma.location.count({
			where: { status: LocationStatus.PENDING, deletedAt: null },
		}),
		prisma.accessibilityReport.count({
			where: { status: ReportStatus.PENDING },
		}),
		prisma.contribution.count({
			where: { status: ContributionStatus.PENDING },
		}),
	]);

	return {
		users,
		locations,
		reports,
		contributions,
		reviews,
		favorites,
		categories,
		notifications,
		auditLogs,
		pending: {
			locations: pendingLocations,
			reports: pendingReports,
			contributions: pendingContributions,
			total: pendingLocations + pendingReports + pendingContributions,
		},
	};
};

const listAuditLogs = async (
	query: IAuditLogQuery,
	pagination: IPagination,
) => {
	const where: Prisma.AuditLogWhereInput = {};

	if (query.action) {
		where.action = { contains: query.action, mode: "insensitive" };
	}
	if (query.actorId) {
		where.actorId = query.actorId;
	}
	if (query.entityType) {
		where.entityType = query.entityType;
	}
	if (query.entityId) {
		where.entityId = query.entityId;
	}
	if (query.from || query.to) {
		where.createdAt = {
			...(query.from ? { gte: query.from } : {}),
			...(query.to ? { lte: query.to } : {}),
		};
	}

	const [data, total] = await Promise.all([
		prisma.auditLog.findMany({
			where,
			orderBy: { createdAt: "desc" },
			include: {
				actor: { select: { id: true, name: true, email: true, role: true } },
			},
			...getPaginationArgs(pagination),
		}),
		prisma.auditLog.count({ where }),
	]);

	return {
		data,
		meta: buildMeta(total, pagination.page, pagination.limit),
	};
};

const getSettings = () => settings;

const updateSettings = (payload: IUpdateSettingsPayload) => {
	settings = {
		...settings,
		...payload,
		features: payload.features
			? { ...settings.features, ...payload.features }
			: settings.features,
		updatedAt: new Date().toISOString(),
	};

	return settings;
};

const clearCache = () => ({
	cleared: true,
	redisConnected: false,
	message:
		"Redis is not connected in this environment; no cached entries were removed.",
});

const getHealth = async () => {
	let database: "up" | "down" = "up";

	try {
		await prisma.$queryRaw`SELECT 1`;
	} catch {
		database = "down";
	}

	return {
		status: database === "up" ? "ok" : "degraded",
		database,
		environment: config.node_env ?? "development",
		uptimeSeconds: Math.floor(process.uptime()),
		timestamp: new Date().toISOString(),
	};
};

const getVersion = () => ({
	name: "accesspath-backend",
	apiVersion: "v1",
	environment: config.node_env ?? "development",
	nodeVersion: process.version,
});

export const AdminService = {
	getStats,
	listAuditLogs,
	getSettings,
	updateSettings,
	clearCache,
	getHealth,
	getVersion,
};
