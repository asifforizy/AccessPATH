import type { Prisma } from "../../../prisma/generated/prisma/client";
import { LocationStatus } from "../../../prisma/generated/prisma/enums";
import type { IAccessibilityFiltersQuery } from "../../utils/query";

const UUID_PATTERN =
	/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface ILocationFilterInput extends IAccessibilityFiltersQuery {
	/** Category id (uuid) or category slug, e.g. "PARK". */
	category?: string;
}

/**
 * Base predicate for every public read: approved + not soft-deleted.
 */
export const publicLocationBase: Prisma.LocationWhereInput = {
	status: LocationStatus.APPROVED,
	deletedAt: null,
};

/**
 * Combines category + accessibility filters onto the public base predicate.
 *
 * Accessibility filters use `accessibility: { is: { flag: true } }`, so a
 * location with no accessibility profile can never match — unknown data is
 * never reported as accessible.
 */
export const buildLocationWhere = (
	filters: ILocationFilterInput,
): Prisma.LocationWhereInput => {
	const where: Prisma.LocationWhereInput = { ...publicLocationBase };
	const and: Prisma.LocationWhereInput[] = [];

	if (filters.category) {
		if (UUID_PATTERN.test(filters.category)) {
			where.categoryId = filters.category;
		} else {
			where.category = { slug: filters.category.toLowerCase() };
		}
	}

	const featureFilters: Array<[keyof IAccessibilityFiltersQuery, string]> = [
		["wheelchairAccess", "wheelchairAccessible"],
		["rampAvailable", "rampAvailable"],
		["elevatorAvailable", "elevatorAvailable"],
		["accessibleRestroom", "accessibleRestroom"],
		["accessibleParking", "accessibleParking"],
		["stepFreeEntrance", "stepFreeEntrance"],
	];

	for (const [queryKey, column] of featureFilters) {
		if (filters[queryKey] === true) {
			and.push({ accessibility: { is: { [column]: true } } });
		}
	}

	if (filters.verifiedOnly === true) {
		and.push({ accessibility: { is: { isVerified: true } } });
	}

	if (and.length) where.AND = and;

	return where;
};

/**
 * Text predicate for name / address / city / description search.
 */
export const buildSearchPredicate = (
	query: string,
): Prisma.LocationWhereInput => ({
	OR: [
		{ name: { contains: query, mode: "insensitive" } },
		{ address: { contains: query, mode: "insensitive" } },
		{ city: { contains: query, mode: "insensitive" } },
		{ description: { contains: query, mode: "insensitive" } },
	],
});

/**
 * Bounding box predicate that also handles antimeridian crossing
 * (west > east), where the box wraps around ±180°.
 */
export const buildBoundingBoxPredicate = (box: {
	north: number;
	south: number;
	east: number;
	west: number;
}): Prisma.LocationWhereInput => {
	const latitude = { gte: box.south, lte: box.north };

	if (box.west <= box.east) {
		return { latitude, longitude: { gte: box.west, lte: box.east } };
	}

	return {
		latitude,
		OR: [{ longitude: { gte: box.west } }, { longitude: { lte: box.east } }],
	};
};
