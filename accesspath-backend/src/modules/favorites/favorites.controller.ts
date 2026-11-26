import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { parsePagination } from "../../utils/pagination";
import { getUserId } from "../../utils/requestUser";
import { sendResponse } from "../../utils/sendResponse";
import type { ICreateFavoritePayload } from "./favorites.interface";
import { FavoriteService } from "./favorites.service";

const getFavoriteId = (req: Request): string => {
	const favoriteId = req.params.favoriteId;

	if (typeof favoriteId !== "string" || !favoriteId) {
		throw new AppError(httpStatus.BAD_REQUEST, "Favorite id is required");
	}

	return favoriteId;
};

const getLocationId = (req: Request): string => {
	const locationId = req.params.locationId;

	if (typeof locationId !== "string" || !locationId) {
		throw new AppError(httpStatus.BAD_REQUEST, "Location id is required");
	}

	return locationId;
};

const listFavorites = catchAsync(async (req: Request, res: Response) => {
	const userId = getUserId(req);
	const pagination = parsePagination(req.query);
	const result = await FavoriteService.listFavorites(userId, pagination);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Favorites fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

const createFavorite = catchAsync(async (req: Request, res: Response) => {
	const userId = getUserId(req);
	const payload = req.body as ICreateFavoritePayload;
	const result = await FavoriteService.createFavorite(
		userId,
		payload.locationId,
	);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Favorite added successfully",
		data: result,
	});
});

const deleteFavorite = catchAsync(async (req: Request, res: Response) => {
	const userId = getUserId(req);
	await FavoriteService.deleteFavorite(userId, getFavoriteId(req));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Favorite removed successfully",
		data: null,
	});
});

const checkFavorite = catchAsync(async (req: Request, res: Response) => {
	const userId = getUserId(req);
	const result = await FavoriteService.checkFavorite(
		userId,
		getLocationId(req),
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Favorite status fetched successfully",
		data: result,
	});
});

const deleteFavoriteByLocation = catchAsync(
	async (req: Request, res: Response) => {
		const userId = getUserId(req);
		await FavoriteService.deleteFavoriteByLocation(userId, getLocationId(req));

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Favorite removed successfully",
			data: null,
		});
	},
);

export const FavoriteController = {
	listFavorites,
	createFavorite,
	deleteFavorite,
	checkFavorite,
	deleteFavoriteByLocation,
};
