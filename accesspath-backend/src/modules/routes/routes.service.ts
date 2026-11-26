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
	BarrierType,
	IEngineWaypoint,
	IRouteBarrierContext,
	IRouteCandidate,
	IRouteLocationContext,
	IRouteRequirements,
} from "./routes.engine";
import {
	buildRouteCandidates,
	candidatesBounds,
	distanceBetween,
	scoreRouteCandidates,
} from "./routes.engine";
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

const ACTIVE_REPORT_STATUSES = [
	ReportStatus.PENDING,
	ReportStatus.UNDER_REVIEW,
];

/**
 * Loads the accessibility context (approved locations with profiles + live
 * barrier reports) around every candidate corridor in one round trip.
 */
const loadRouteContext = async (candidates: IRouteCandidate[]) => {
	const bounds = candidatesBounds(candidates);

	const [locations, reports] = await Promise.all([
		prisma.location.findMany({
			where: {
				status: LocationStatus.APPROVED,
				deletedAt: null,
				latitude: { gte: bounds.south, lte: bounds.north },
				longitude: { gte: bounds.west, lte: bounds.east },
				accessibility: { isNot: null },
			},
			select: {
				id: true,
				name: true,
				latitude: true,
				longitude: true,
				accessibility: true,
			},
			take: 2_000,
		}),
		prisma.accessibilityReport.findMany({
			where: {
				status: { in: ACTIVE_REPORT_STATUSES },
				OR: [
					{
						latitude: { gte: bounds.south, lte: bounds.north },
						longitude: { gte: bounds.west, lte: bounds.east },
					},
					{
						latitude: null,
						location: {
							latitude: { gte: bounds.south, lte: bounds.north },
							longitude: { gte: bounds.west, lte: bounds.east },
						},
					},
				],
			},
			select: {
				id: true,
				type: true,
				description: true,
				status: true,
				latitude: true,
				longitude: true,
				locationId: true,
				location: { select: { name: true, latitude: true, longitude: true } },
			},
			take: 1_000,
		}),
	]);

	const locationContext: IRouteLocationContext[] = locations
		.filter((location) => location.accessibility)
		.map((location) => ({
			id: location.id,
			name: location.name,
			latitude: location.latitude,
			longitude: location.longitude,
			accessibilityScore: location.accessibility?.accessibilityScore ?? null,
			isVerified: location.accessibility?.isVerified ?? false,
			stepFreeEntrance: location.accessibility?.stepFreeEntrance ?? false,
			rampAvailable: location.accessibility?.rampAvailable ?? false,
			elevatorAvailable: location.accessibility?.elevatorAvailable ?? false,
			accessibleRestroom: location.accessibility?.accessibleRestroom ?? false,
			accessibleParking: location.accessibility?.accessibleParking ?? false,
			doorAccessibility: location.accessibility?.doorAccessibility ?? false,
		}));

	const barrierContext: IRouteBarrierContext[] = reports.map((report) => ({
		id: report.id,
		type: report.type as BarrierType,
		description: report.description,
		status: report.status as "PENDING" | "UNDER_REVIEW",
		latitude: report.latitude ?? report.location?.latitude ?? 0,
		longitude: report.longitude ?? report.location?.longitude ?? 0,
		locationId: report.locationId,
		locationName: report.location?.name ?? null,
	}));

	return { locations: locationContext, barriers: barrierContext };
};

const buildRankedOptions = async (payload: IPlanPayload) => {
	const travelMode = (payload.travelMode ?? TravelMode.WALKING) as TravelMode;
	const candidates = buildRouteCandidates(
		payload.origin,
		payload.destination,
		4,
	);
	const context = await loadRouteContext(candidates);

	return scoreRouteCandidates({
		candidates,
		locations: context.locations,
		barriers: context.barriers,
		travelMode: travelMode as never,
		requirements: (payload.accessibilityRequirements ?? undefined) as
			| IRouteRequirements
			| undefined,
	});
};

const planRoute = async (userId: string, payload: IPlanPayload) => {
	const options = await buildRankedOptions(payload);
	const best = options[0];

	if (!best) {
		throw new AppError(
			httpStatus.INTERNAL_SERVER_ERROR,
			"Route options could not be generated",
		);
	}

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
				travelMode: best.travelMode as TravelMode,
				distanceMeters: best.distanceMeters,
				durationSeconds: best.durationSeconds,
				routeData: asJson({
					waypoints: best.waypoints,
					accessibilityScore: best.accessibilityScore,
					breakdown: best.breakdown,
					warnings: best.warnings,
					support: best.support,
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
		travelMode: best.travelMode,
		distanceMeters: best.distanceMeters,
		durationSeconds: best.durationSeconds,
		distanceText: best.distanceText,
		durationText: best.durationText,
		waypoints: best.waypoints,
		accessibilityScore: best.accessibilityScore,
		grade: best.grade,
		accessibilityBreakdown: best.breakdown,
		warnings: best.warnings,
		support: best.support,
		alternatives: options.map((option) => ({
			id: option.id,
			label: option.label,
			kind: option.kind,
			recommended: option.recommended,
			waypoints: option.waypoints,
			distanceMeters: option.distanceMeters,
			durationSeconds: option.durationSeconds,
			distanceText: option.distanceText,
			durationText: option.durationText,
			accessibilityScore: option.accessibilityScore,
			grade: option.grade,
			detourPercent: option.detourPercent,
			breakdown: option.breakdown,
			warnings: option.warnings,
			support: option.support,
		})),
		accessibilityRequirements: payload.accessibilityRequirements ?? null,
		isSaved: Boolean(routeId),
	};
};

const getAlternatives = async (payload: IAlternativesPayload) => {
	const options = await buildRankedOptions(payload);

	return {
		origin: payload.origin,
		destination: payload.destination,
		travelMode: (payload.travelMode ?? TravelMode.WALKING) as TravelMode,
		recommendedId: options[0]?.id ?? null,
		alternatives: options,
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

/** Reads waypoints from a saved route, falling back to the straight line. */
const routeWaypointsOf = (route: {
	originLatitude: number;
	originLongitude: number;
	destinationLatitude: number;
	destinationLongitude: number;
	routeData: unknown;
}): IEngineWaypoint[] => {
	const data = route.routeData as { waypoints?: IEngineWaypoint[] } | null;
	const stored = data?.waypoints;

	if (Array.isArray(stored) && stored.length >= 2) {
		return stored.map((point) => ({
			latitude: point.latitude,
			longitude: point.longitude,
			name: point.name,
		}));
	}

	return [
		{ latitude: route.originLatitude, longitude: route.originLongitude },
		{
			latitude: route.destinationLatitude,
			longitude: route.destinationLongitude,
		},
	];
};

/**
 * Barriers along the saved route corridor (not just near the destination).
 * Reports without GPS coordinates fall back to their location pin.
 */
const getBarriers = async (
	userId: string,
	role: UserRole,
	routeId: string,
	radiusMeters: number,
) => {
	const route = await findRoute(userId, role, routeId);
	const waypoints = routeWaypointsOf(route);
	const candidates = buildRouteCandidates(
		waypoints[0] ?? {
			latitude: route.originLatitude,
			longitude: route.originLongitude,
		},
		waypoints[waypoints.length - 1] ?? {
			latitude: route.destinationLatitude,
			longitude: route.destinationLongitude,
		},
		2,
	);
	const bounds = candidatesBounds(candidates, radiusMeters);

	const reports = await prisma.accessibilityReport.findMany({
		where: {
			status: { in: [ReportStatus.PENDING, ReportStatus.UNDER_REVIEW] },
			OR: [
				{
					latitude: { gte: bounds.south, lte: bounds.north },
					longitude: { gte: bounds.west, lte: bounds.east },
				},
				{
					latitude: null,
					location: {
						latitude: { gte: bounds.south, lte: bounds.north },
						longitude: { gte: bounds.west, lte: bounds.east },
					},
				},
			],
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

	const points = waypoints;
	const barriers = reports
		.map((report) => {
			const coordinates = {
				latitude: report.latitude ?? report.location.latitude,
				longitude: report.longitude ?? report.location.longitude,
			};

			// Distance to the nearest waypoint of the saved route.
			const distanceMeters = Math.round(
				Math.min(...points.map((point) => distanceBetween(point, coordinates))),
			);

			return { ...report, coordinates, distanceMeters };
		})
		.filter((report) => report.distanceMeters <= radiusMeters)
		.sort((a, b) => a.distanceMeters - b.distanceMeters);

	return {
		routeId,
		center: waypoints[waypoints.length - 1],
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
