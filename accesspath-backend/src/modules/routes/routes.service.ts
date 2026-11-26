import httpStatus from "http-status";
import type { UserRole } from "../../../prisma/generated/prisma/enums";
import {
	LocationStatus,
	ReportStatus,
	UserRole as Roles,
	TravelMode,
} from "../../../prisma/generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { haversineMeters, roundMeters } from "../../utils/geo";
import { asJson, toJson } from "../../utils/json";
import type {
	IAlternativesPayload,
	IFeedbackPayload,
	IPlanPayload,
	IPreferencesPayload,
	IScorePayload,
	IValidatePayload,
} from "./routes.interface";

const TRAVEL_SPEEDS: Record<TravelMode, number> = {
	[TravelMode.WALKING]: 1.4,
	[TravelMode.WHEELCHAIR]: 1.1,
	[TravelMode.CYCLING]: 4.5,
	[TravelMode.DRIVING]: 11.1,
};

const FEATURE_KEYS = [
	"wheelchairAccessible",
	"rampAvailable",
	"elevatorAvailable",
	"accessibleRestroom",
	"accessibleParking",
	"stepFreeEntrance",
	"tactilePaving",
	"brailleSignage",
	"hearingLoop",
] as const;

const speedFor = (mode: TravelMode) => TRAVEL_SPEEDS[mode] ?? 1.4;

const formatDuration = (seconds: number) => {
	const minutes = Math.round(seconds / 60);
	if (minutes < 60) {
		return `${minutes} min`;
	}

	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	return `${hours}h ${rest}m`;
};

const buildRoute = (payload: IPlanPayload) => {
	const travelMode = (payload.travelMode ?? TravelMode.WALKING) as TravelMode;
	const distanceMeters = roundMeters(
		haversineMeters(payload.origin, payload.destination),
	);

	return {
		travelMode,
		distanceMeters,
		durationSeconds: Math.round(distanceMeters / speedFor(travelMode)),
		waypoints: [
			{
				latitude: payload.origin.latitude,
				longitude: payload.origin.longitude,
			},
			{
				latitude: payload.destination.latitude,
				longitude: payload.destination.longitude,
			},
		],
	};
};

const planRoute = async (userId: string, payload: IPlanPayload) => {
	const route = buildRoute(payload);
	let routeId: string | null = null;

	if (payload.save) {
		const saved = await prisma.savedRoute.create({
			data: {
				name: payload.name ?? null,
				originName: payload.origin.name ?? "Origin",
				originLatitude: payload.origin.latitude,
				originLongitude: payload.origin.longitude,
				destinationName: payload.destination.name ?? "Destination",
				destinationLatitude: payload.destination.latitude,
				destinationLongitude: payload.destination.longitude,
				travelMode: route.travelMode,
				distanceMeters: route.distanceMeters,
				durationSeconds: route.durationSeconds,
				routeData: asJson({
					waypoints: route.waypoints,
					generatedAt: new Date().toISOString(),
				}),
				accessibilityRequirements: toJson(payload.accessibilityRequirements),
				userId,
			},
		});

		routeId = saved.id;
	}

	return {
		routeId,
		origin: payload.origin,
		destination: payload.destination,
		travelMode: route.travelMode,
		distanceMeters: route.distanceMeters,
		durationSeconds: route.durationSeconds,
		distanceText: `${(route.distanceMeters / 1000).toFixed(2)} km`,
		durationText: formatDuration(route.durationSeconds),
		waypoints: route.waypoints,
		accessibilityRequirements: payload.accessibilityRequirements ?? null,
		isSaved: Boolean(routeId),
	};
};

const getAlternatives = (payload: IAlternativesPayload) => {
	const base = buildRoute(payload);
	const labels = ["Fastest", "Most accessible", "Shortest", "Scenic"];
	const factors = [1, 1.12, 0.94, 1.2];

	const alternatives = Array.from({ length: payload.count }, (_, index) => {
		const distanceMeters = roundMeters(
			base.distanceMeters * (factors[index] ?? 1 + index * 0.05),
		);

		return {
			label: labels[index] ?? `Option ${index + 1}`,
			travelMode: base.travelMode,
			distanceMeters,
			durationSeconds: Math.round(distanceMeters / speedFor(base.travelMode)),
			distanceText: `${(distanceMeters / 1000).toFixed(2)} km`,
			accessibilityScore: Math.max(0, 92 - index * 7),
		};
	});

	return {
		origin: payload.origin,
		destination: payload.destination,
		alternatives,
	};
};

const findRoute = async (userId: string, role: UserRole, routeId: string) => {
	const route = await prisma.savedRoute.findFirst({
		where: {
			id: routeId,
			...(role === Roles.ADMIN ? {} : { userId }),
		},
	});

	if (!route) {
		throw new AppError(httpStatus.NOT_FOUND, "Route not found");
	}

	return route;
};

const getRoute = async (userId: string, role: UserRole, routeId: string) =>
	findRoute(userId, role, routeId);

const findNearbyLocations = async (
	center: { latitude: number; longitude: number },
	radiusMeters: number,
) => {
	const locations = await prisma.location.findMany({
		where: {
			deletedAt: null,
			status: LocationStatus.APPROVED,
			accessibility: { isNot: null },
		},
		include: { accessibility: true },
		take: 500,
	});

	return locations
		.map((location) => ({
			...location,
			distanceMeters: roundMeters(
				haversineMeters(center, {
					latitude: location.latitude,
					longitude: location.longitude,
				}),
			),
		}))
		.filter((location) => location.distanceMeters <= radiusMeters)
		.sort((a, b) => a.distanceMeters - b.distanceMeters);
};

const getBarriers = async (
	userId: string,
	role: UserRole,
	routeId: string,
	radiusMeters: number,
) => {
	const route = await findRoute(userId, role, routeId);
	const center = {
		latitude: route.destinationLatitude,
		longitude: route.destinationLongitude,
	};

	const reports = await prisma.accessibilityReport.findMany({
		where: {
			status: { in: [ReportStatus.PENDING, ReportStatus.UNDER_REVIEW] },
		},
		include: {
			attachments: true,
			location: {
				select: {
					id: true,
					name: true,
					slug: true,
					city: true,
					latitude: true,
					longitude: true,
				},
			},
		},
		take: 500,
	});

	const barriers = reports
		.map((report) => ({
			...report,
			distanceMeters: roundMeters(
				haversineMeters(center, {
					latitude: report.location.latitude,
					longitude: report.location.longitude,
				}),
			),
		}))
		.filter((report) => report.distanceMeters <= radiusMeters)
		.sort((a, b) => a.distanceMeters - b.distanceMeters);

	return {
		routeId,
		center,
		radiusMeters,
		total: barriers.length,
		barriers,
	};
};

const getRouteAccessibility = async (
	userId: string,
	role: UserRole,
	routeId: string,
) => {
	const route = await findRoute(userId, role, routeId);
	const center = {
		latitude: route.destinationLatitude,
		longitude: route.destinationLongitude,
	};

	const nearby = await findNearbyLocations(center, 2_000);
	const profiles = nearby
		.map((location) => location.accessibility)
		.filter((profile) => profile !== null);

	const total = profiles.length;
	const averageScore =
		total > 0
			? Math.round(
					profiles.reduce(
						(sum, profile) => sum + profile.accessibilityScore,
						0,
					) / total,
				)
			: 0;

	const features = FEATURE_KEYS.reduce<Record<string, number>>((acc, key) => {
		acc[key] = profiles.filter((profile) => profile[key]).length;
		return acc;
	}, {});

	return {
		routeId,
		center,
		nearbyCount: nearby.length,
		averageScore,
		verifiedCount: profiles.filter((profile) => profile.isVerified).length,
		features,
		locations: nearby.map((location) => ({
			id: location.id,
			name: location.name,
			slug: location.slug,
			distanceMeters: location.distanceMeters,
			accessibilityScore: location.accessibility?.accessibilityScore ?? 0,
			isVerified: location.accessibility?.isVerified ?? false,
		})),
	};
};

const scoreRoute = async (
	userId: string,
	role: UserRole,
	payload: IScorePayload,
) => {
	let center: { latitude: number; longitude: number };

	if (payload.routeId) {
		const route = await findRoute(userId, role, payload.routeId);
		center = {
			latitude: route.destinationLatitude,
			longitude: route.destinationLongitude,
		};
	} else {
		if (!payload.destination) {
			throw new AppError(httpStatus.BAD_REQUEST, "Destination is required");
		}
		center = {
			latitude: payload.destination.latitude,
			longitude: payload.destination.longitude,
		};
	}

	const nearby = await findNearbyLocations(center, payload.radiusMeters);
	const profiles = nearby
		.map((location) => location.accessibility)
		.filter((profile) => profile !== null);

	const total = profiles.length;
	const averageScore =
		total > 0
			? profiles.reduce((sum, profile) => sum + profile.accessibilityScore, 0) /
				total
			: 0;
	const verifiedRatio =
		total > 0
			? profiles.filter((profile) => profile.isVerified).length / total
			: 0;
	const featureCoverage =
		total > 0
			? FEATURE_KEYS.reduce(
					(sum, key) =>
						sum + profiles.filter((profile) => profile[key]).length / total,
					0,
				) / FEATURE_KEYS.length
			: 0;

	const accessibilityScore = Math.round(
		averageScore * 0.6 +
			verifiedRatio * 100 * 0.25 +
			featureCoverage * 100 * 0.15,
	);

	return {
		center,
		radiusMeters: payload.radiusMeters,
		nearbyCount: nearby.length,
		averageScore: Math.round(averageScore),
		verifiedRatio: Math.round(verifiedRatio * 100),
		featureCoverage: Math.round(featureCoverage * 100),
		accessibilityScore,
		grade:
			accessibilityScore >= 85
				? "A"
				: accessibilityScore >= 70
					? "B"
					: accessibilityScore >= 55
						? "C"
						: accessibilityScore >= 40
							? "D"
							: "E",
	};
};

const addRouteFeedback = async (
	userId: string,
	role: UserRole,
	routeId: string,
	payload: IFeedbackPayload,
) => {
	await findRoute(userId, role, routeId);

	const log = await prisma.auditLog.create({
		data: {
			action: "ROUTE_FEEDBACK",
			entityType: "SavedRoute",
			entityId: routeId,
			actorId: userId,
			metadata: asJson(payload),
		},
	});

	return {
		id: log.id,
		routeId,
		rating: payload.rating,
		comment: payload.comment ?? null,
		createdAt: log.createdAt,
	};
};

const validateRoute = (payload: IValidatePayload) => {
	const travelMode = (payload.travelMode ?? TravelMode.WALKING) as TravelMode;
	const distanceMeters = roundMeters(
		haversineMeters(payload.origin, payload.destination),
	);
	const issues: string[] = [];

	if (distanceMeters === 0) {
		issues.push("Origin and destination are identical");
	}

	return {
		valid: issues.length === 0,
		issues,
		travelMode,
		distanceMeters,
		estimatedDurationSeconds: Math.round(distanceMeters / speedFor(travelMode)),
	};
};

const ensurePreference = async (userId: string) => {
	const existing = await prisma.userPreference.findUnique({
		where: { userId },
	});

	if (existing) {
		return existing;
	}

	return prisma.userPreference.create({ data: { userId } });
};

const getPreferences = async (userId: string) => ensurePreference(userId);

const updatePreferences = async (
	userId: string,
	payload: IPreferencesPayload,
) => {
	await ensurePreference(userId);

	return prisma.userPreference.update({
		where: { userId },
		data: {
			travelMode: payload.travelMode as TravelMode | undefined,
			accessibilityNeeds: toJson(payload.accessibilityNeeds),
			preferredLanguage: payload.preferredLanguage,
			notificationEnabled: payload.notificationEnabled,
		},
	});
};

export const RouteService = {
	planRoute,
	getAlternatives,
	getRoute,
	getBarriers,
	getRouteAccessibility,
	scoreRoute,
	addRouteFeedback,
	validateRoute,
	getPreferences,
	updatePreferences,
};
