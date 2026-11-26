import type { Prisma } from "../../../prisma/generated/prisma/client";
import { prisma } from "../../lib/prisma";
import {
	buildBoundingBoxPredicate,
	buildLocationWhere,
} from "../places/places.filters";
import {
	type IPlaceGeoFeature,
	placeCardSelect,
	toGeoJsonFeature,
} from "../places/places.serializer";

export interface IExploreQuery {
	north: number;
	south: number;
	east: number;
	west: number;
	zoom?: number;
	category?: string;
	limit: number;
	wheelchairAccess?: boolean;
	rampAvailable?: boolean;
	elevatorAvailable?: boolean;
	accessibleRestroom?: boolean;
	accessibleParking?: boolean;
	stepFreeEntrance?: boolean;
	verifiedOnly?: boolean;
}

/**
 * Returns a GeoJSON FeatureCollection for the visible map bounds.
 *
 * Only approved, non-deleted locations are returned. Accessibility filters are
 * resolved in the database (never post-filtered), so unknown accessibility data
 * can never leak into an accessibility-only result set.
 */
const explore = async (query: IExploreQuery) => {
	const baseWhere = buildLocationWhere(query);
	const where: Prisma.LocationWhereInput = {
		...baseWhere,
		AND: [
			...(Array.isArray(baseWhere.AND) ? baseWhere.AND : []),
			buildBoundingBoxPredicate(query),
		],
	};

	const rows = await prisma.location.findMany({
		where,
		select: placeCardSelect,
		orderBy: [{ name: "asc" }],
		take: query.limit + 1,
	});

	const truncated = rows.length > query.limit;
	const features: IPlaceGeoFeature[] = rows
		.slice(0, query.limit)
		.map(toGeoJsonFeature);

	return {
		type: "FeatureCollection" as const,
		features,
		meta: {
			returned: features.length,
			truncated,
			limit: query.limit,
			bbox: {
				north: query.north,
				south: query.south,
				east: query.east,
				west: query.west,
			},
			zoom: query.zoom ?? null,
		},
	};
};

export const MapService = {
	explore,
};
