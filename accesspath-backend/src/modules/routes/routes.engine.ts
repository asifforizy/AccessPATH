/**
 * Accessibility-aware route scoring engine.
 *
 * No external routing provider is configured (no API key), so route geometry is
 * generated deterministically as *candidate corridors* around the straight line
 * between origin and destination. Everything downstream of geometry is real:
 * each candidate is scored from actual accessibility profiles and barrier
 * reports that lie inside its corridor.
 *
 * The scoring model (documented in docs/route-scoring.md):
 *
 *   score = 100
 *         - distancePenalty        (detour vs. shortest candidate, max 25)
 *         - barrierPenalty         (live barrier reports in the corridor, max 60)
 *         + supportBonus           (verified accessibility along corridor, max 18)
 *         + modeBonus              (step-free coverage for wheelchair mode, max 6)
 *         - requirementPenalty     (unmet accessibility requirements, max 20)
 *         - dataQualityPenalty     (unverified / missing data, max 9)
 *
 * Routes are ranked by score first and duration second: accessibility wins over
 * distance, exactly as the product requires.
 */

export type RouteTravelMode = "WALKING" | "WHEELCHAIR" | "CYCLING" | "DRIVING";

export interface IEngineCoordinate {
	latitude: number;
	longitude: number;
}

export interface IEngineWaypoint extends IEngineCoordinate {
	name?: string;
}

export type BarrierType =
	| "BROKEN_FOOTPATH"
	| "MISSING_RAMP"
	| "BLOCKED_SIDEWALK"
	| "BROKEN_ELEVATOR"
	| "UNSAFE_CROSSING"
	| "ACCESSIBILITY_ISSUE"
	| "MISSING_FEATURE"
	| "LOCATION_CLOSED"
	| "INCORRECT_INFORMATION"
	| "OTHER";

export interface IRouteLocationContext extends IEngineCoordinate {
	id: string;
	name: string;
	accessibilityScore: number | null;
	isVerified: boolean;
	stepFreeEntrance: boolean;
	rampAvailable: boolean;
	elevatorAvailable: boolean;
	accessibleRestroom: boolean;
	accessibleParking: boolean;
	doorAccessibility: boolean;
}

export interface IRouteBarrierContext extends IEngineCoordinate {
	id: string;
	type: BarrierType;
	description: string;
	status: "PENDING" | "UNDER_REVIEW";
	locationId: string;
	locationName: string | null;
}

export interface IRouteRequirements {
	avoidStairs?: boolean;
	requireElevator?: boolean;
	requireRestroom?: boolean;
	requireParking?: boolean;
	avoidUnsafeCrossings?: boolean;
}

export interface IRouteWarning {
	code: string;
	severity: "high" | "medium" | "low";
	message: string;
	distanceMeters?: number;
	barrierType?: BarrierType;
	locationId?: string;
}

export interface IRouteScoreBreakdown {
	distancePenalty: number;
	barrierPenalty: number;
	supportBonus: number;
	modeBonus: number;
	requirementPenalty: number;
	dataQualityPenalty: number;
}

export interface IRouteCandidate {
	id: string;
	label: string;
	kind: "direct" | "left" | "right" | "double-bend";
	waypoints: IEngineWaypoint[];
	distanceMeters: number;
	durationSeconds: number;
}

export interface IRouteOption extends IRouteCandidate {
	recommended: boolean;
	travelMode: RouteTravelMode;
	distanceText: string;
	durationText: string;
	accessibilityScore: number;
	grade: "A" | "B" | "C" | "D" | "E";
	detourPercent: number;
	breakdown: IRouteScoreBreakdown;
	warnings: IRouteWarning[];
	support: {
		sampledLocations: number;
		verifiedRatio: number;
		stepFreeRatio: number;
		barriers: Partial<Record<BarrierType, number>>;
		corridorRadiusMeters: number;
	};
}

const EARTH_RADIUS_METERS = 6_371_000;
const METERS_PER_DEGREE_LAT = 111_320;
const CORRIDOR_RADIUS_METERS = 80;
const SAMPLE_SPACING_METERS = 120;
const MAX_SAMPLES = 60;

/** Penalty weight per barrier type (before proximity weighting). */
export const BARRIER_WEIGHTS: Record<BarrierType, number> = {
	BROKEN_ELEVATOR: 14,
	UNSAFE_CROSSING: 14,
	BLOCKED_SIDEWALK: 11,
	BROKEN_FOOTPATH: 9,
	ACCESSIBILITY_ISSUE: 8,
	LOCATION_CLOSED: 8,
	MISSING_RAMP: 7,
	MISSING_FEATURE: 5,
	OTHER: 4,
	INCORRECT_INFORMATION: 3,
};

/** Barriers that hurt wheelchair users more than other modes. */
const WHEELCHAIR_SENSITIVE = new Set<BarrierType>([
	"MISSING_RAMP",
	"UNSAFE_CROSSING",
	"BROKEN_FOOTPATH",
	"BLOCKED_SIDEWALK",
]);

const SPEEDS: Record<RouteTravelMode, number> = {
	WALKING: 1.4,
	WHEELCHAIR: 1.1,
	CYCLING: 4.5,
	DRIVING: 11.1,
};

const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

export const distanceBetween = (
	a: IEngineCoordinate,
	b: IEngineCoordinate,
): number => {
	const dLat = toRadians(b.latitude - a.latitude);
	const dLng = toRadians(b.longitude - a.longitude);
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRadians(a.latitude)) *
			Math.cos(toRadians(b.latitude)) *
			Math.sin(dLng / 2) ** 2;

	return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(h)));
};

const offsetPoint = (
	point: IEngineCoordinate,
	meters: number,
	bearingRadians: number,
): IEngineCoordinate => {
	const lat =
		point.latitude +
		(meters * Math.cos(bearingRadians)) / METERS_PER_DEGREE_LAT;
	const lng =
		point.longitude +
		(meters * Math.sin(bearingRadians)) /
			(METERS_PER_DEGREE_LAT *
				Math.max(Math.cos(toRadians(point.latitude)), 0.01));

	return {
		latitude: Number(lat.toFixed(6)),
		longitude: Number(lng.toFixed(6)),
	};
};

const polylineDistance = (waypoints: IEngineWaypoint[]): number => {
	let total = 0;
	for (let index = 1; index < waypoints.length; index += 1) {
		const previous = waypoints[index - 1];
		const current = waypoints[index];
		if (previous && current) total += distanceBetween(previous, current);
	}
	return Math.round(total);
};

/**
 * Candidate corridors: the direct line plus lateral/double-bend deviations.
 * Offsets scale with trip length but stay within a realistic walking detour.
 */
export const buildRouteCandidates = (
	origin: IEngineCoordinate,
	destination: IEngineCoordinate,
	count = 4,
): IRouteCandidate[] => {
	const total = distanceBetween(origin, destination);
	const offsetMeters = Math.min(900, Math.max(120, total * 0.08));
	const bearing = Math.atan2(
		destination.longitude - origin.longitude,
		destination.latitude - origin.latitude,
	);

	const mid = {
		latitude: (origin.latitude + destination.latitude) / 2,
		longitude: (origin.longitude + destination.longitude) / 2,
	};
	const quarter = {
		latitude: origin.latitude + (destination.latitude - origin.latitude) * 0.3,
		longitude:
			origin.longitude + (destination.longitude - origin.longitude) * 0.3,
	};
	const threeQuarter = {
		latitude: origin.latitude + (destination.latitude - origin.latitude) * 0.7,
		longitude:
			origin.longitude + (destination.longitude - origin.longitude) * 0.7,
	};

	const variants: Array<{
		kind: IRouteCandidate["kind"];
		label: string;
		waypoints: IEngineWaypoint[];
	}> = [
		{
			kind: "direct",
			label: "Direct corridor",
			waypoints: [origin, destination],
		},
		{
			kind: "left",
			label: "Left-side corridor",
			waypoints: [
				origin,
				offsetPoint(mid, offsetMeters, bearing + Math.PI / 2),
				destination,
			],
		},
		{
			kind: "right",
			label: "Right-side corridor",
			waypoints: [
				origin,
				offsetPoint(mid, offsetMeters, bearing - Math.PI / 2),
				destination,
			],
		},
		{
			kind: "double-bend",
			label: "Wide sweep corridor",
			waypoints: [
				origin,
				offsetPoint(quarter, offsetMeters * 0.7, bearing + Math.PI / 2),
				offsetPoint(threeQuarter, offsetMeters * 0.7, bearing - Math.PI / 2),
				destination,
			],
		},
	];

	return variants
		.slice(0, Math.min(Math.max(count, 2), variants.length))
		.map((variant, index) => ({
			id: `route-${variant.kind}-${index + 1}`,
			label: variant.label,
			kind: variant.kind,
			waypoints: variant.waypoints,
			distanceMeters: polylineDistance(variant.waypoints),
			durationSeconds: Math.round(
				polylineDistance(variant.waypoints) / SPEEDS.WALKING,
			),
		}));
};

/**
 * Samples a corridor every ~120m so barriers and accessibility data are only
 * counted where the route actually goes.
 */
export const sampleCorridor = (
	waypoints: IEngineWaypoint[],
): IEngineCoordinate[] => {
	const samples: IEngineCoordinate[] = [];

	for (let index = 1; index < waypoints.length; index += 1) {
		const from = waypoints[index - 1];
		const to = waypoints[index];
		if (!from || !to) continue;

		const segment = distanceBetween(from, to);
		const steps = Math.max(1, Math.ceil(segment / SAMPLE_SPACING_METERS));

		for (let step = 0; step <= steps; step += 1) {
			const ratio = step / steps;
			samples.push({
				latitude: from.latitude + (to.latitude - from.latitude) * ratio,
				longitude: from.longitude + (to.longitude - from.longitude) * ratio,
			});
			if (samples.length >= MAX_SAMPLES) return samples;
		}
	}

	return samples;
};

/** Bounding box (with corridor radius margin) covering every candidate. */
export const candidatesBounds = (
	candidates: IRouteCandidate[],
	marginMeters = CORRIDOR_RADIUS_METERS,
) => {
	let north = Number.NEGATIVE_INFINITY;
	let south = Number.POSITIVE_INFINITY;
	let east = Number.NEGATIVE_INFINITY;
	let west = Number.POSITIVE_INFINITY;

	for (const candidate of candidates) {
		for (const point of candidate.waypoints) {
			north = Math.max(north, point.latitude);
			south = Math.min(south, point.latitude);
			east = Math.max(east, point.longitude);
			west = Math.min(west, point.longitude);
		}
	}

	const latMargin = marginMeters / METERS_PER_DEGREE_LAT;
	const lngMargin =
		marginMeters /
		(METERS_PER_DEGREE_LAT *
			Math.max(Math.cos(toRadians((north + south) / 2)), 0.01));

	return {
		north: north + latMargin,
		south: south - latMargin,
		east: east + lngMargin,
		west: west - lngMargin,
	};
};

const minDistanceToCorridor = (
	point: IEngineCoordinate,
	samples: IEngineCoordinate[],
): number => {
	let min = Number.POSITIVE_INFINITY;
	for (const sample of samples) {
		const value = distanceBetween(point, sample);
		if (value < min) min = value;
	}
	return min;
};

const clamp = (value: number, min: number, max: number) =>
	Math.min(max, Math.max(min, value));

const grade = (score: number): IRouteOption["grade"] =>
	score >= 85
		? "A"
		: score >= 70
			? "B"
			: score >= 55
				? "C"
				: score >= 40
					? "D"
					: "E";

const formatDuration = (seconds: number) => {
	const minutes = Math.round(seconds / 60);
	if (minutes < 60) return `${minutes} min`;
	const hours = Math.floor(minutes / 60);
	return `${hours}h ${minutes % 60}m`;
};

const barrierMessage = (barrier: IRouteBarrierContext) => {
	const where = barrier.locationName ? ` near ${barrier.locationName}` : "";
	switch (barrier.type) {
		case "BROKEN_FOOTPATH":
			return `Broken footpath${where}`;
		case "MISSING_RAMP":
			return `Missing ramp${where}`;
		case "BLOCKED_SIDEWALK":
			return `Blocked sidewalk${where}`;
		case "BROKEN_ELEVATOR":
			return `Broken elevator${where}`;
		case "UNSAFE_CROSSING":
			return `Unsafe crossing${where}`;
		case "ACCESSIBILITY_ISSUE":
			return `Reported accessibility issue${where}`;
		case "LOCATION_CLOSED":
			return `Location reported closed${where}`;
		default:
			return `Reported accessibility concern${where}`;
	}
};

export interface IScoreOptionsInput {
	candidates: IRouteCandidate[];
	locations: IRouteLocationContext[];
	barriers: IRouteBarrierContext[];
	travelMode: RouteTravelMode;
	requirements?: IRouteRequirements;
	corridorRadiusMeters?: number;
}

/**
 * Scores every candidate corridor and ranks them accessibility-first.
 */
export const scoreRouteCandidates = ({
	candidates,
	locations,
	barriers,
	travelMode,
	requirements,
	corridorRadiusMeters = CORRIDOR_RADIUS_METERS,
}: IScoreOptionsInput): IRouteOption[] => {
	const shortest = Math.min(
		...candidates.map((candidate) => candidate.distanceMeters),
	);
	const radius = corridorRadiusMeters;

	const scored = candidates.map<IRouteOption>((candidate) => {
		const samples = sampleCorridor(candidate.waypoints);
		const warnings: IRouteWarning[] = [];

		// Accessibility support inside the corridor (nearest occurrence wins).
		const supporting = new Map<
			string,
			{ location: IRouteLocationContext; distance: number }
		>();
		for (const location of locations) {
			const distance = minDistanceToCorridor(location, samples);
			if (distance <= radius)
				supporting.set(location.id, { location, distance });
		}

		// Live barriers inside the corridor.
		const corridorBarriers = new Map<
			string,
			{ barrier: IRouteBarrierContext; distance: number; proximity: number }
		>();
		for (const barrier of barriers) {
			const distance = minDistanceToCorridor(barrier, samples);
			if (distance <= radius) {
				corridorBarriers.set(barrier.id, {
					barrier,
					distance,
					proximity: clamp(1 - distance / radius, 0.35, 1),
				});
			}
		}

		// 1) Distance penalty (vs. the shortest candidate).
		const detour = shortest > 0 ? candidate.distanceMeters / shortest - 1 : 0;
		const distancePenalty = Math.round(clamp(detour * 80, 0, 25) * 10) / 10;

		// 2) Support bonus from verified, feature-rich locations.
		const supportScores = [...supporting.values()]
			.slice(0, 8)
			.map(({ location }) => {
				const quality =
					((location.accessibilityScore ?? 0) / 100) * 0.45 +
					(location.isVerified ? 0.3 : 0.12) +
					(location.stepFreeEntrance ? 0.15 : 0) +
					(location.rampAvailable ? 0.1 : 0) +
					(location.elevatorAvailable ? 0.1 : 0) +
					(location.doorAccessibility ? 0.05 : 0);

				return clamp(quality, 0, 1);
			});
		const supportAverage =
			supportScores.length > 0
				? supportScores.reduce((sum, value) => sum + value, 0) /
					supportScores.length
				: 0;
		const supportBonus = Math.round(supportAverage * 18 * 10) / 10;

		// 3) Barrier penalties (proximity + mode weighted), capped.
		let rawBarrierPenalty = 0;
		const barrierCounts: Partial<Record<BarrierType, number>> = {};

		for (const { barrier, distance, proximity } of corridorBarriers.values()) {
			const modeMultiplier =
				travelMode === "WHEELCHAIR" && WHEELCHAIR_SENSITIVE.has(barrier.type)
					? 1.25
					: 1;

			rawBarrierPenalty +=
				BARRIER_WEIGHTS[barrier.type] * proximity * modeMultiplier;

			barrierCounts[barrier.type] = (barrierCounts[barrier.type] ?? 0) + 1;

			warnings.push({
				code: `BARRIER_${barrier.type}`,
				severity:
					distancelessSeverity(BARRIER_WEIGHTS[barrier.type]) ??
					(BARRIER_WEIGHTS[barrier.type] >= 11 ? "high" : "medium"),
				message: barrierMessage(barrier),
				distanceMeters: Math.round(distance),
				barrierType: barrier.type,
				locationId: barrier.locationId,
			});
		}

		if (
			requirements?.avoidUnsafeCrossings &&
			(barrierCounts.UNSAFE_CROSSING ?? 0) > 0
		) {
			rawBarrierPenalty += 6;
		}

		const barrierPenalty =
			Math.round(clamp(rawBarrierPenalty, 0, 60) * 10) / 10;

		// 4) Wheelchair step-free coverage bonus.
		const stepFree = [...supporting.values()].filter(
			({ location }) => location.stepFreeEntrance,
		).length;
		const stepFreeRatio = supporting.size > 0 ? stepFree / supporting.size : 0;
		const modeBonus =
			travelMode === "WHEELCHAIR" ? Math.round(stepFreeRatio * 6 * 10) / 10 : 0;

		// 5) Explicit accessibility requirements.
		let requirementPenalty = 0;

		if (requirements?.avoidStairs) {
			if (supporting.size === 0 || stepFreeRatio < 0.5) {
				requirementPenalty += 10;
				warnings.push({
					code: "REQUIREMENT_STEP_FREE_UNMET",
					severity: "high",
					message:
						"Fewer than half of the nearby places are confirmed step-free, so a stair-free route cannot be guaranteed.",
				});
			}
		}

		if (requirements?.requireElevator) {
			const hasElevator = [...supporting.values()].some(
				({ location }) => location.elevatorAvailable,
			);
			if (!hasElevator) {
				requirementPenalty += 6;
				warnings.push({
					code: "REQUIREMENT_ELEVATOR_UNMET",
					severity: "high",
					message: "No elevator is confirmed along this route.",
				});
			}
		}

		if (requirements?.requireRestroom) {
			const hasRestroom = [...supporting.values()].some(
				({ location }) => location.accessibleRestroom,
			);
			if (!hasRestroom) {
				requirementPenalty += 4;
			}
		}

		if (requirements?.requireParking) {
			const hasParking = [...supporting.values()].some(
				({ location }) => location.accessibleParking,
			);
			if (!hasParking) {
				requirementPenalty += 2;
			}
		}

		requirementPenalty = clamp(requirementPenalty, 0, 20);

		// 6) Data quality: unverified or missing accessibility data is discounted.
		const verifiedCount = [...supporting.values()].filter(
			({ location }) => location.isVerified,
		).length;
		const verifiedRatio =
			supporting.size > 0 ? verifiedCount / supporting.size : 0;

		let dataQualityPenalty = 0;

		if (supporting.size === 0) {
			dataQualityPenalty = 9;
			warnings.push({
				code: "NO_ACCESSIBILITY_DATA",
				severity: "medium",
				message:
					"No accessibility information is recorded along this route. Conditions are unknown, not confirmed accessible.",
			});
		} else if (verifiedRatio < 0.5) {
			dataQualityPenalty = 4;
			warnings.push({
				code: "LOW_VERIFIED_COVERAGE",
				severity: "low",
				message: "Most accessibility data along this route is unverified.",
			});
		}

		const rawScore =
			100 -
			distancePenalty -
			barrierPenalty +
			supportBonus +
			modeBonus -
			requirementPenalty -
			dataQualityPenalty;

		const accessibilityScore = Math.round(clamp(rawScore, 0, 100));

		const sortedWarnings = warnings.sort(
			(a, b) =>
				severityRank(b.severity) - severityRank(a.severity) ||
				(a.distanceMeters ?? 0) - (b.distanceMeters ?? 0),
		);

		return {
			...candidate,
			recommended: false,
			travelMode,
			distanceText: `${(candidate.distanceMeters / 1000).toFixed(2)} km`,
			durationSeconds: Math.round(
				candidate.distanceMeters / SPEEDS[travelMode],
			),
			durationText: formatDuration(
				candidate.distanceMeters / SPEEDS[travelMode],
			),
			accessibilityScore,
			grade: grade(accessibilityScore),
			detourPercent: Math.round(detour * 100),
			breakdown: {
				distancePenalty,
				barrierPenalty,
				supportBonus,
				modeBonus,
				requirementPenalty,
				dataQualityPenalty,
			},
			warnings: sortedWarnings,
			support: {
				sampledLocations: supporting.size,
				verifiedRatio: Math.round(verifiedRatio * 100),
				stepFreeRatio: Math.round(stepFreeRatio * 100),
				barriers: barrierCounts,
				corridorRadiusMeters: radius,
			},
		};
	});

	// Accessibility first, duration second.
	scored.sort(
		(a, b) =>
			b.accessibilityScore - a.accessibilityScore ||
			a.durationSeconds - b.durationSeconds,
	);

	return scored.map((option, index) => ({
		...option,
		recommended: index === 0,
		label:
			index === 0 ? "Recommended" : index === 1 ? "Alternative" : option.label,
	}));
};

const severityRank = (severity: IRouteWarning["severity"]) =>
	severity === "high" ? 3 : severity === "medium" ? 2 : 1;

function distancelessSeverity(
	weight: number,
): IRouteWarning["severity"] | null {
	if (weight >= 11) return "high";
	if (weight >= 7) return "medium";
	return "low";
}
