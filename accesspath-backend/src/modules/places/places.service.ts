import httpStatus from "http-status";
import type { Prisma } from "../../../prisma/generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { haversineMeters, roundMeters } from "../../utils/geo";
import { LocationService } from "../locations/locations.service";
import {
	buildLocationWhere,
	buildSearchPredicate,
	publicLocationBase,
} from "../places/places.filters";
import {
	type PlaceCardRow,
	placeCardSelect,
	serializePlaceCard,
} from "../places/places.serializer";
import type { INearbyQuery, ISearchQuery } from "./places.validation";

const METERS_PER_DEGREE_LAT = 111_320;
const NEAREST_CANDIDATE_CAP = 300;

const withDistance = (
	row: PlaceCardRow,
	origin: { latitude: number; longitude: number },
) => ({
	...serializePlaceCard(row),
	distanceMeters: roundMeters(haversineMeters(origin, row)),
});

const mergeWhere = (
	base: Prisma.LocationWhereInput,
	extra: Prisma.LocationWhereInput,
): Prisma.LocationWhereInput => ({ AND: [base, extra] });

/**
 * Nearby places: a cheap bounding-box prefilter in the database, then exact
 * haversine filtering + distance sorting. Unknown accessibility never matches
 * accessibility filters because those are applied in the DB predicate.
 */
const nearby = async (query: INearbyQuery) => {
	const origin = { latitude: query.latitude, longitude: query.longitude };
	const latitudeDelta = query.radius / METERS_PER_DEGREE_LAT;
	const longitudeDelta =
		query.radius /
		(METERS_PER_DEGREE_LAT *
			Math.max(Math.cos((origin.latitude * Math.PI) / 180), 0.01));

	const baseWhere = buildLocationWhere(query);
	const where: Prisma.LocationWhereInput = {
		...baseWhere,
		AND: [
			...(Array.isArray(baseWhere.AND) ? baseWhere.AND : []),
			{
				latitude: {
					gte: origin.latitude - latitudeDelta,
					lte: origin.latitude + latitudeDelta,
				},
				longitude: {
					gte: origin.longitude - longitudeDelta,
					lte: origin.longitude + longitudeDelta,
				},
			},
		],
	};

	const rows = await prisma.location.findMany({
		where,
		select: placeCardSelect,
		take: 500,
	});

	const items = rows
		.map((row) => withDistance(row, origin))
		.filter((item) => item.distanceMeters <= query.radius)
		.sort((a, b) => a.distanceMeters - b.distanceMeters)
		.slice(0, query.limit);

	return {
		origin,
		radius: query.radius,
		items,
		meta: {
			page: 1,
			limit: query.limit,
			total: items.length,
			totalPages: 1,
			radius: query.radius,
		},
	};
};

interface ISortBucket {
	where: Prisma.LocationWhereInput;
	orderBy: Prisma.LocationOrderByWithRelationInput[];
}

/**
 * Sort buckets put better-known accessibility data first:
 * - score           → has an accessibility profile (score desc), then unknown
 * - recently_verified → verified, then unverified, then unknown
 *
 * This avoids unknown accessibility data being ranked above known data.
 */
const sortBuckets = (
	where: Prisma.LocationWhereInput,
	sort: ISearchQuery["sort"],
): ISortBucket[] => {
	if (sort === "recently_verified") {
		return [
			{
				where: mergeWhere(where, {
					accessibility: { is: { isVerified: true } },
				}),
				orderBy: [
					{ accessibility: { verifiedAt: "desc" } },
					{ updatedAt: "desc" },
				],
			},
			{
				where: mergeWhere(where, {
					accessibility: { is: { isVerified: false } },
				}),
				orderBy: [{ updatedAt: "desc" }],
			},
			{
				where: mergeWhere(where, { accessibility: { is: null } }),
				orderBy: [{ name: "asc" }],
			},
		];
	}

	return [
		{
			where: mergeWhere(where, { accessibility: { isNot: null } }),
			orderBy: [
				{ accessibility: { accessibilityScore: "desc" } },
				{ name: "asc" },
			],
		},
		{
			where: mergeWhere(where, { accessibility: { is: null } }),
			orderBy: [{ name: "asc" }],
		},
	];
};

const paginateBuckets = async (
	buckets: ISortBucket[],
	page: number,
	limit: number,
) => {
	const counts = await Promise.all(
		buckets.map((bucket) => prisma.location.count({ where: bucket.where })),
	);

	const total = counts.reduce((sum, count) => sum + count, 0);
	const start = (page - 1) * limit;
	const items: ReturnType<typeof serializePlaceCard>[] = [];
	let offset = 0;

	for (const [index, bucket] of buckets.entries()) {
		const count = counts[index] ?? 0;
		const bucketStart = Math.max(0, start - offset);
		const remaining = limit - items.length;

		if (bucketStart < count && remaining > 0) {
			const take = Math.min(remaining, count - bucketStart);
			const rows = await prisma.location.findMany({
				where: bucket.where,
				select: placeCardSelect,
				orderBy: bucket.orderBy,
				skip: bucketStart,
				take,
			});

			items.push(...rows.map((row) => serializePlaceCard(row)));
		}

		offset += count;
		if (items.length >= limit) break;
	}

	return { items, total };
};

/**
 * Search places by free text, category and accessibility features.
 *
 * `sort=nearest` needs caller coordinates and is resolved in application code
 * (distance is not a database column); candidates are capped before sorting.
 */
const search = async (query: ISearchQuery) => {
	const baseWhere = buildLocationWhere(query);
	const and = Array.isArray(baseWhere.AND) ? baseWhere.AND : [];

	if (query.query) and.push(buildSearchPredicate(query.query));

	const where: Prisma.LocationWhereInput = and.length
		? { ...baseWhere, AND: and }
		: baseWhere;

	if (query.sort === "nearest") {
		if (
			typeof query.latitude !== "number" ||
			typeof query.longitude !== "number"
		) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"latitude and longitude are required to sort by distance",
			);
		}

		const origin = { latitude: query.latitude, longitude: query.longitude };
		const rows = await prisma.location.findMany({
			where,
			select: placeCardSelect,
			take: NEAREST_CANDIDATE_CAP,
		});

		const sorted = rows
			.map((row) => withDistance(row, origin))
			.sort((a, b) => a.distanceMeters - b.distanceMeters);

		const start = (query.page - 1) * query.limit;

		return {
			items: sorted.slice(start, start + query.limit),
			meta: {
				page: query.page,
				limit: query.limit,
				total: sorted.length,
				totalPages: Math.max(1, Math.ceil(sorted.length / query.limit)),
				sort: query.sort,
				truncatedCandidates: rows.length === NEAREST_CANDIDATE_CAP,
			},
		};
	}

	const { items, total } = await paginateBuckets(
		sortBuckets(where, query.sort),
		query.page,
		query.limit,
	);

	return {
		items,
		meta: {
			page: query.page,
			limit: query.limit,
			total,
			totalPages: Math.max(1, Math.ceil(total / query.limit)),
			sort: query.sort,
			truncatedCandidates: false,
		},
	};
};

const detail = async (placeId: string) => {
	return LocationService.getLocation(placeId);
};

const categories = async () => {
	const rows = await prisma.category.findMany({
		where: { isActive: true },
		select: {
			id: true,
			name: true,
			slug: true,
			_count: {
				select: { locations: { where: publicLocationBase } },
			},
		},
		orderBy: { name: "asc" },
	});

	return rows.map((row) => ({
		id: row.id,
		name: row.name,
		slug: row.slug,
		count: row._count.locations,
	}));
};

export const PlaceService = {
	nearby,
	search,
	detail,
	categories,
};
