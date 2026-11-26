import type { Prisma } from "../../../prisma/generated/prisma/client";
import {
	categoryGroup,
	featureFlags,
	verificationStatus,
} from "../../utils/accessibility";

/**
 * Minimal projection returned by the map + search endpoints.
 */
export const placeCardSelect = {
	id: true,
	name: true,
	slug: true,
	address: true,
	city: true,
	state: true,
	country: true,
	latitude: true,
	longitude: true,
	category: { select: { id: true, name: true, slug: true } },
	accessibility: {
		select: {
			accessibilityScore: true,
			isVerified: true,
			verifiedAt: true,
			wheelchairAccessible: true,
			rampAvailable: true,
			elevatorAvailable: true,
			accessibleRestroom: true,
			accessibleParking: true,
			stepFreeEntrance: true,
			tactilePaving: true,
			brailleSignage: true,
			hearingLoop: true,
		},
	},
	photos: { where: { isPrimary: true }, take: 1 },
	_count: { select: { reviews: true, favorites: true } },
} satisfies Prisma.LocationSelect;

export type PlaceCardRow = Prisma.LocationGetPayload<{
	select: typeof placeCardSelect;
}>;

export const serializePlaceCard = (row: PlaceCardRow) => ({
	id: row.id,
	name: row.name,
	slug: row.slug,
	address: row.address,
	city: row.city,
	state: row.state,
	country: row.country,
	latitude: row.latitude,
	longitude: row.longitude,
	category: row.category,
	categoryGroup: categoryGroup(row.category?.name, row.category?.slug),
	accessibilityScore: row.accessibility?.accessibilityScore ?? null,
	verification: verificationStatus(row.accessibility),
	verifiedAt: row.accessibility?.verifiedAt ?? null,
	features: featureFlags(row.accessibility),
	photo: row.photos[0]?.url ?? null,
	reviewCount: row._count.reviews,
});

export type SerializedPlaceCard = ReturnType<typeof serializePlaceCard>;

export interface IPlaceGeoFeature {
	type: "Feature";
	geometry: { type: "Point"; coordinates: [number, number] };
	properties: SerializedPlaceCard;
}

export const toGeoJsonFeature = (row: PlaceCardRow): IPlaceGeoFeature => ({
	type: "Feature",
	geometry: {
		type: "Point",
		coordinates: [row.longitude, row.latitude],
	},
	properties: serializePlaceCard(row),
});
