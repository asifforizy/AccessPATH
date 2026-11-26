import {
	ContributionStatus,
	LocationStatus,
	ReportStatus,
} from "../../../prisma/generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import type {
	IHeatmapQuery,
	IMonthlyTrendsQuery,
	ITopAreasQuery,
} from "./analytics.interface";

const toRecord = (
	groups: unknown[],
	key: (group: Record<string, unknown>) => string,
) => {
	const result: Record<string, number> = {};

	for (const group of groups) {
		const item = group as Record<string, unknown> & {
			_count?: { _all?: number };
		};
		result[key(item)] = item._count?._all ?? 0;
	}

	return result;
};

const getOverview = async () => {
	const [
		users,
		locations,
		reports,
		contributions,
		reviews,
		favorites,
		pendingReports,
		pendingContributions,
		pendingLocations,
	] = await Promise.all([
		prisma.user.count({ where: { deletedAt: null } }),
		prisma.location.count({ where: { deletedAt: null } }),
		prisma.accessibilityReport.count(),
		prisma.contribution.count(),
		prisma.review.count(),
		prisma.favorite.count(),
		prisma.accessibilityReport.count({
			where: { status: ReportStatus.PENDING },
		}),
		prisma.contribution.count({
			where: { status: ContributionStatus.PENDING },
		}),
		prisma.location.count({
			where: {
				status: LocationStatus.PENDING,
				deletedAt: null,
			},
		}),
	]);

	return {
		users,
		locations,
		reports,
		contributions,
		reviews,
		favorites,
		pending: {
			reports: pendingReports,
			contributions: pendingContributions,
			locations: pendingLocations,
			total: pendingReports + pendingContributions + pendingLocations,
		},
	};
};

const getLocationAnalytics = async () => {
	const [byStatusGroups, byCategoryGroups, topCities, scoreAggregate] =
		await Promise.all([
			prisma.location.groupBy({
				by: ["status"],
				where: { deletedAt: null },
				_count: { _all: true },
			}),
			prisma.location.groupBy({
				by: ["categoryId"],
				where: { deletedAt: null },
				_count: { _all: true },
			}),
			prisma.location.groupBy({
				by: ["city"],
				where: { deletedAt: null },
				_count: { _all: true },
				orderBy: { _count: { city: "desc" } },
				take: 10,
			}),
			prisma.accessibilityProfile.aggregate({
				_avg: { accessibilityScore: true },
				_count: { _all: true },
			}),
		]);

	const categoryIds = byCategoryGroups.map((group) => group.categoryId);
	const categories = await prisma.category.findMany({
		where: { id: { in: categoryIds } },
		select: { id: true, name: true, slug: true },
	});
	const categoryMap = new Map(
		categories.map((category) => [category.id, category]),
	);

	return {
		total: byStatusGroups.reduce((sum, group) => sum + group._count._all, 0),
		byStatus: toRecord(byStatusGroups, (group) => String(group.status)),
		byCategory: byCategoryGroups.map((group) => ({
			categoryId: group.categoryId,
			category: categoryMap.get(group.categoryId) ?? null,
			count: group._count._all,
		})),
		topCities: topCities.map((group) => ({
			city: group.city,
			count: group._count._all,
		})),
		averageAccessibilityScore: scoreAggregate._avg.accessibilityScore ?? 0,
		profiles: scoreAggregate._count._all,
	};
};

const getReportAnalytics = async () => {
	const [byStatusGroups, byTypeGroups] = await Promise.all([
		prisma.accessibilityReport.groupBy({
			by: ["status"],
			_count: { _all: true },
		}),
		prisma.accessibilityReport.groupBy({
			by: ["type"],
			_count: { _all: true },
		}),
	]);

	return {
		total: byStatusGroups.reduce((sum, group) => sum + group._count._all, 0),
		byStatus: toRecord(byStatusGroups, (group) => String(group.status)),
		byType: toRecord(byTypeGroups, (group) => String(group.type)),
	};
};

const getContributionAnalytics = async () => {
	const [byStatusGroups, byTypeGroups] = await Promise.all([
		prisma.contribution.groupBy({
			by: ["status"],
			_count: { _all: true },
		}),
		prisma.contribution.groupBy({
			by: ["type"],
			_count: { _all: true },
		}),
	]);

	return {
		total: byStatusGroups.reduce((sum, group) => sum + group._count._all, 0),
		byStatus: toRecord(byStatusGroups, (group) => String(group.status)),
		byType: toRecord(byTypeGroups, (group) => String(group.type)),
	};
};

const getUserAnalytics = async () => {
	const since = new Date();
	since.setDate(since.getDate() - 30);

	const [byRoleGroups, byStatusGroups, newUsers] = await Promise.all([
		prisma.user.groupBy({
			by: ["role"],
			where: { deletedAt: null },
			_count: { _all: true },
		}),
		prisma.user.groupBy({
			by: ["status"],
			_count: { _all: true },
		}),
		prisma.user.count({
			where: { createdAt: { gte: since }, deletedAt: null },
		}),
	]);

	return {
		total: byRoleGroups.reduce((sum, group) => sum + group._count._all, 0),
		byRole: toRecord(byRoleGroups, (group) => String(group.role)),
		byStatus: toRecord(byStatusGroups, (group) => String(group.status)),
		newUsersLast30Days: newUsers,
	};
};

const getModerationAnalytics = async () => {
	const [
		pendingReports,
		underReviewReports,
		resolvedReports,
		pendingContributions,
		flaggedSubmissions,
		totalReviews,
	] = await Promise.all([
		prisma.accessibilityReport.count({
			where: { status: ReportStatus.PENDING },
		}),
		prisma.accessibilityReport.count({
			where: { status: ReportStatus.UNDER_REVIEW },
		}),
		prisma.accessibilityReport.count({
			where: { status: ReportStatus.RESOLVED },
		}),
		prisma.contribution.count({
			where: { status: ContributionStatus.PENDING },
		}),
		prisma.auditLog.count({
			where: { action: "SUBMISSION_FLAGGED" },
		}),
		prisma.review.count(),
	]);

	return {
		pendingReports,
		underReviewReports,
		resolvedReports,
		pendingContributions,
		flaggedSubmissions,
		totalReviews,
	};
};

const monthKey = (date: Date) =>
	`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const getMonthlyTrends = async (query: IMonthlyTrendsQuery) => {
	const now = new Date();
	const start = new Date(
		now.getFullYear(),
		now.getMonth() - (query.months - 1),
		1,
	);

	const keys: string[] = [];
	for (let index = query.months - 1; index >= 0; index -= 1) {
		keys.push(monthKey(new Date(now.getFullYear(), now.getMonth() - index, 1)));
	}

	const [users, locations, reports, contributions, reviews] = await Promise.all(
		[
			prisma.user.findMany({
				where: { createdAt: { gte: start } },
				select: { createdAt: true },
			}),
			prisma.location.findMany({
				where: { createdAt: { gte: start } },
				select: { createdAt: true },
			}),
			prisma.accessibilityReport.findMany({
				where: { createdAt: { gte: start } },
				select: { createdAt: true },
			}),
			prisma.contribution.findMany({
				where: { createdAt: { gte: start } },
				select: { createdAt: true },
			}),
			prisma.review.findMany({
				where: { createdAt: { gte: start } },
				select: { createdAt: true },
			}),
		],
	);

	const empty = () =>
		Object.fromEntries(keys.map((key) => [key, 0])) as Record<string, number>;

	const buckets = {
		users: empty(),
		locations: empty(),
		reports: empty(),
		contributions: empty(),
		reviews: empty(),
	};

	const add = (
		target: Record<string, number>,
		items: { createdAt: Date }[],
	) => {
		for (const item of items) {
			const key = monthKey(item.createdAt);
			if (key in target) {
				target[key] = (target[key] ?? 0) + 1;
			}
		}
	};

	add(buckets.users, users);
	add(buckets.locations, locations);
	add(buckets.reports, reports);
	add(buckets.contributions, contributions);
	add(buckets.reviews, reviews);

	return keys.map((key) => ({
		month: key,
		users: buckets.users[key] ?? 0,
		locations: buckets.locations[key] ?? 0,
		reports: buckets.reports[key] ?? 0,
		contributions: buckets.contributions[key] ?? 0,
		reviews: buckets.reviews[key] ?? 0,
	}));
};

const getTopBarrierAreas = async (query: ITopAreasQuery) => {
	const reports = await prisma.accessibilityReport.findMany({
		select: {
			location: { select: { city: true, country: true } },
		},
		take: 5_000,
	});

	const counts = new Map<string, number>();

	for (const report of reports) {
		const key = `${report.location.city}, ${report.location.country}`;
		counts.set(key, (counts.get(key) ?? 0) + 1);
	}

	return Array.from(counts.entries())
		.map(([area, count]) => ({ area, count }))
		.sort((a, b) => b.count - a.count)
		.slice(0, query.limit);
};

const getCategoryDistribution = async () => {
	const groups = await prisma.location.groupBy({
		by: ["categoryId"],
		where: { deletedAt: null },
		_count: { _all: true },
	});

	const categories = await prisma.category.findMany({
		where: { id: { in: groups.map((group) => group.categoryId) } },
		select: { id: true, name: true, slug: true },
	});
	const categoryMap = new Map(
		categories.map((category) => [category.id, category]),
	);

	return groups
		.map((group) => ({
			categoryId: group.categoryId,
			name: categoryMap.get(group.categoryId)?.name ?? "Unknown",
			slug: categoryMap.get(group.categoryId)?.slug ?? null,
			count: group._count._all,
		}))
		.sort((a, b) => b.count - a.count);
};

const getAccessibilityDistribution = async () => {
	const profiles = await prisma.accessibilityProfile.findMany({
		select: {
			accessibilityScore: true,
			isVerified: true,
		},
	});

	const buckets = [
		{ range: "0-20", min: 0, max: 20, count: 0 },
		{ range: "21-40", min: 21, max: 40, count: 0 },
		{ range: "41-60", min: 41, max: 60, count: 0 },
		{ range: "61-80", min: 61, max: 80, count: 0 },
		{ range: "81-100", min: 81, max: 100, count: 0 },
	];

	for (const profile of profiles) {
		const bucket = buckets.find(
			(item) =>
				profile.accessibilityScore >= item.min &&
				profile.accessibilityScore <= item.max,
		);
		if (bucket) {
			bucket.count += 1;
		}
	}

	return {
		total: profiles.length,
		verified: profiles.filter((profile) => profile.isVerified).length,
		buckets: buckets.map(({ range, count }) => ({ range, count })),
	};
};

const getHeatmap = async (query: IHeatmapQuery) => {
	const locations = await prisma.location.findMany({
		where: { deletedAt: null },
		select: {
			id: true,
			name: true,
			latitude: true,
			longitude: true,
			_count: { select: { reports: true } },
		},
		take: query.limit,
	});

	return {
		total: locations.length,
		points: locations.map((location) => ({
			locationId: location.id,
			name: location.name,
			latitude: location.latitude,
			longitude: location.longitude,
			weight: location._count.reports + 1,
		})),
	};
};

export const AnalyticsService = {
	getOverview,
	getLocationAnalytics,
	getReportAnalytics,
	getContributionAnalytics,
	getUserAnalytics,
	getModerationAnalytics,
	getMonthlyTrends,
	getTopBarrierAreas,
	getCategoryDistribution,
	getAccessibilityDistribution,
	getHeatmap,
};
