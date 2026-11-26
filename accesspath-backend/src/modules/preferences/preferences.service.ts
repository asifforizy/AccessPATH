import type { Prisma } from "../../../prisma/generated/prisma/client";
import { LocationStatus } from "../../../prisma/generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { asJson } from "../../utils/json";
import type {
	IRecommendationsQuery,
	IUpdateAccessibilityPayload,
	IUpdatePreferencesPayload,
} from "./preferences.interface";

const BOOLEAN_PROFILE_KEYS = [
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

const ensurePreference = async (userId: string) => {
	const existing = await prisma.userPreference.findUnique({
		where: { userId },
	});

	if (existing) {
		return existing;
	}

	return prisma.userPreference.create({ data: { userId } });
};

const getPreferences = async (userId: string) => {
	const preference = await ensurePreference(userId);

	return preference;
};

const updatePreferences = async (
	userId: string,
	payload: IUpdatePreferencesPayload,
) => {
	await ensurePreference(userId);

	const data: Prisma.UserPreferenceUpdateInput = {};

	if (payload.travelMode !== undefined) {
		data.travelMode = payload.travelMode;
	}
	if (payload.accessibilityNeeds !== undefined) {
		data.accessibilityNeeds = asJson(payload.accessibilityNeeds);
	}
	if (payload.preferredLanguage !== undefined) {
		data.preferredLanguage = payload.preferredLanguage;
	}
	if (payload.notificationEnabled !== undefined) {
		data.notificationEnabled = payload.notificationEnabled;
	}

	return prisma.userPreference.update({ where: { userId }, data });
};

const getAccessibilityPreferences = async (userId: string) => {
	const preference = await ensurePreference(userId);
	const needs = preference.accessibilityNeeds;

	return {
		userId,
		accessibilityNeeds:
			needs && typeof needs === "object" && !Array.isArray(needs)
				? (needs as Record<string, unknown>)
				: {},
	};
};

const updateAccessibilityPreferences = async (
	userId: string,
	payload: IUpdateAccessibilityPayload,
) => {
	await ensurePreference(userId);

	const preference = await prisma.userPreference.update({
		where: { userId },
		data: { accessibilityNeeds: asJson(payload.accessibilityNeeds) },
	});

	return {
		userId,
		accessibilityNeeds: payload.accessibilityNeeds,
		updatedAt: preference.updatedAt,
	};
};

const getRecommendations = async (
	userId: string,
	query: IRecommendationsQuery,
) => {
	const preference = await ensurePreference(userId);
	const needs = preference.accessibilityNeeds;

	const profileFilters: Record<string, boolean> = {};

	if (needs && typeof needs === "object" && !Array.isArray(needs)) {
		const needsRecord = needs as Record<string, unknown>;
		for (const key of BOOLEAN_PROFILE_KEYS) {
			if (needsRecord[key] === true) {
				profileFilters[key] = true;
			}
		}
	}

	const where: Prisma.LocationWhereInput = {
		deletedAt: null,
		status: LocationStatus.APPROVED,
		accessibility: Object.keys(profileFilters).length
			? { is: profileFilters as Prisma.AccessibilityProfileWhereInput }
			: { isNot: null },
	};

	const locations = await prisma.location.findMany({
		where,
		include: {
			category: { select: { id: true, name: true, slug: true } },
			accessibility: true,
			photos: {
				where: { isPrimary: true },
				take: 1,
				select: { id: true, url: true },
			},
		},
		take: Math.max(query.limit * 3, query.limit),
	});

	return {
		travelMode: preference.travelMode,
		matchedNeeds: Object.keys(profileFilters),
		data: locations
			.sort(
				(a, b) =>
					(b.accessibility?.accessibilityScore ?? 0) -
					(a.accessibility?.accessibilityScore ?? 0),
			)
			.slice(0, query.limit),
	};
};

export const PreferenceService = {
	getPreferences,
	updatePreferences,
	getAccessibilityPreferences,
	updateAccessibilityPreferences,
	getRecommendations,
};
