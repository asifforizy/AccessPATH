import httpStatus from "http-status";
import type { Prisma } from "../../../prisma/generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
	buildMeta,
	getPaginationArgs,
	type IPagination,
} from "../../utils/pagination";

const favoriteInclude = {
	location: {
		include: {
			category: { select: { id: true, name: true, slug: true } },
			accessibility: true,
			photos: { where: { isPrimary: true }, take: 1 },
		},
	},
} satisfies Prisma.FavoriteInclude;

const listFavorites = async (userId: string, pagination: IPagination) => {
	const where: Prisma.FavoriteWhereInput = { userId };

	const [data, total] = await Promise.all([
		prisma.favorite.findMany({
			where,
			include: favoriteInclude,
			orderBy: { createdAt: "desc" },
			...getPaginationArgs(pagination),
		}),
		prisma.favorite.count({ where }),
	]);

	return {
		data,
		meta: buildMeta(total, pagination.page, pagination.limit),
	};
};

const assertLocationExists = async (locationId: string) => {
	const location = await prisma.location.findFirst({
		where: { id: locationId, deletedAt: null },
		select: { id: true },
	});

	if (!location) {
		throw new AppError(httpStatus.NOT_FOUND, "Location not found");
	}
};

const createFavorite = async (userId: string, locationId: string) => {
	await assertLocationExists(locationId);

	return prisma.favorite.upsert({
		where: { userId_locationId: { userId, locationId } },
		update: {},
		create: { userId, locationId },
		include: favoriteInclude,
	});
};

const deleteFavorite = async (userId: string, favoriteId: string) => {
	const favorite = await prisma.favorite.findUnique({
		where: { id: favoriteId },
		select: { id: true, userId: true },
	});

	if (!favorite || favorite.userId !== userId) {
		throw new AppError(httpStatus.NOT_FOUND, "Favorite not found");
	}

	await prisma.favorite.delete({ where: { id: favoriteId } });

	return null;
};

const checkFavorite = async (userId: string, locationId: string) => {
	const favorite = await prisma.favorite.findUnique({
		where: { userId_locationId: { userId, locationId } },
		select: { id: true },
	});

	return { locationId, isFavorite: Boolean(favorite) };
};

const deleteFavoriteByLocation = async (userId: string, locationId: string) => {
	const favorite = await prisma.favorite.findUnique({
		where: { userId_locationId: { userId, locationId } },
		select: { id: true },
	});

	if (!favorite) {
		throw new AppError(httpStatus.NOT_FOUND, "Favorite not found");
	}

	await prisma.favorite.delete({ where: { id: favorite.id } });

	return null;
};

export const FavoriteService = {
	listFavorites,
	createFavorite,
	deleteFavorite,
	checkFavorite,
	deleteFavoriteByLocation,
};
