import type { Prisma } from "../../../prisma/generated/prisma/client";
import { LocationStatus } from "../../../prisma/generated/prisma/enums";
import { prisma } from "../../lib/prisma";

const publicLocationWhere = {
	status: LocationStatus.APPROVED,
	deletedAt: null,
} satisfies Prisma.LocationWhereInput;

const featuredLocationSelect = {
	id: true,
	name: true,
	slug: true,
	description: true,
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
	photos: {
		orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
		take: 1,
	},
	_count: {
		select: { reviews: true, favorites: true, reports: true },
	},
} satisfies Prisma.LocationSelect;

const getHome = async () => {
	const [
		places,
		verifiedPlaces,
		reviews,
		accessibility,
		cityRows,
		categories,
		featured,
	] = await Promise.all([
		prisma.location.count({ where: publicLocationWhere }),
		prisma.location.count({
			where: {
				...publicLocationWhere,
				accessibility: { is: { isVerified: true } },
			},
		}),
		prisma.review.count({ where: { location: publicLocationWhere } }),
		prisma.accessibilityProfile.aggregate({
			where: { location: publicLocationWhere },
			_avg: { accessibilityScore: true },
		}),
		prisma.location.groupBy({
			by: ["city"],
			where: publicLocationWhere,
			_count: { city: true },
			orderBy: { _count: { city: "desc" } },
		}),
		prisma.category.findMany({
			where: { isActive: true },
			select: {
				id: true,
				name: true,
				slug: true,
				_count: {
					select: { locations: { where: publicLocationWhere } },
				},
			},
			orderBy: { name: "asc" },
		}),
		prisma.location.findMany({
			where: {
				...publicLocationWhere,
				accessibility: { isNot: null },
			},
			select: featuredLocationSelect,
			orderBy: [
				{ accessibility: { accessibilityScore: "desc" } },
				{ createdAt: "desc" },
			],
			take: 6,
		}),
	]);

	const ratings = featured.length
		? await prisma.review.groupBy({
				by: ["locationId"],
				where: { locationId: { in: featured.map((location) => location.id) } },
				_avg: { rating: true },
				_count: { rating: true },
			})
		: [];

	const ratingByLocation = new Map(
		ratings.map((rating) => [rating.locationId, rating]),
	);

	return {
		stats: {
			places,
			verifiedPlaces,
			reviews,
			cities: cityRows.length,
			averageAccessibilityScore: Math.round(
				accessibility._avg.accessibilityScore ?? 0,
			),
		},
		cities: cityRows.slice(0, 8).map((row) => ({
			city: row.city,
			count: row._count.city,
		})),
		categories: categories
			.map((category) => ({
				id: category.id,
				name: category.name,
				slug: category.slug,
				count: category._count.locations,
			}))
			.filter((category) => category.count > 0),
		featured: featured.map((location) => {
			const rating = ratingByLocation.get(location.id);

			return {
				...location,
				averageRating: rating?._avg.rating ?? null,
				ratingCount: rating?._count.rating ?? 0,
			};
		}),
	};
};

export const PublicService = {
	getHome,
};
