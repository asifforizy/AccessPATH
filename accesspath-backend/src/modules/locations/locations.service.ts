import httpStatus from "http-status";
import type { Prisma } from "../../../prisma/generated/prisma/client";
import { LocationStatus } from "../../../prisma/generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
	buildMeta,
	getPaginationArgs,
	type IPagination,
} from "../../utils/pagination";
import type { IListLocationsQuery } from "./locations.interface";

const locationCardSelect = {
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
	status: true,
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

const buildWhere = (query: IListLocationsQuery): Prisma.LocationWhereInput => {
	const where: Prisma.LocationWhereInput = {
		status: LocationStatus.APPROVED,
		deletedAt: null,
	};

	if (query.q) {
		where.OR = [
			{ name: { contains: query.q, mode: "insensitive" } },
			{ address: { contains: query.q, mode: "insensitive" } },
			{ city: { contains: query.q, mode: "insensitive" } },
			{ description: { contains: query.q, mode: "insensitive" } },
		];
	}

	if (query.city) {
		where.city = { equals: query.city, mode: "insensitive" };
	}

	if (query.categoryId) {
		where.categoryId = query.categoryId;
	}

	return where;
};

const listLocations = async (query: IListLocationsQuery) => {
	const pagination: IPagination = { page: query.page, limit: query.limit };
	const where = buildWhere(query);

	const [data, total] = await Promise.all([
		prisma.location.findMany({
			where,
			select: locationCardSelect,
			orderBy: [{ status: "asc" }, { createdAt: "desc" }],
			...getPaginationArgs(pagination),
		}),
		prisma.location.count({ where }),
	]);

	return {
		data,
		meta: buildMeta(total, pagination.page, pagination.limit),
	};
};

const getLocation = async (locationId: string) => {
	const location = await prisma.location.findFirst({
		where: { id: locationId, deletedAt: null },
		include: {
			category: { select: { id: true, name: true, slug: true } },
			accessibility: true,
			photos: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
			reviews: {
				orderBy: { createdAt: "desc" },
				take: 20,
				include: {
					user: { select: { id: true, name: true, image: true } },
					_count: { select: { helpfulVotes: true } },
				},
			},
			_count: {
				select: { reviews: true, favorites: true, reports: true },
			},
		},
	});

	if (!location) {
		throw new AppError(httpStatus.NOT_FOUND, "Location not found");
	}

	const ratingAggregate = await prisma.review.aggregate({
		where: { locationId },
		_avg: { rating: true },
		_count: { rating: true },
	});

	return {
		...location,
		averageRating: ratingAggregate._avg.rating
			? Number(ratingAggregate._avg.rating.toFixed(1))
			: null,
		reviewCount: ratingAggregate._count.rating,
	};
};

const listCities = async () => {
	const cities = await prisma.location.groupBy({
		where: { status: LocationStatus.APPROVED, deletedAt: null },
		by: ["city"],
		_count: { city: true },
		orderBy: { _count: { city: "desc" } },
		take: 30,
	});

	return cities.map((city) => ({
		city: city.city,
		count: city._count.city,
	}));
};

export const LocationService = {
	listLocations,
	getLocation,
	listCities,
};
