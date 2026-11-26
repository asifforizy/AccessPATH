import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { parseQuery } from "../../utils/parse";
import { sendResponse } from "../../utils/sendResponse";
import { PlaceService } from "./places.service";
import { PlaceValidation } from "./places.validation";

const nearby = catchAsync(async (req: Request, res: Response) => {
	const query = parseQuery(PlaceValidation.NearbyQueryZodSchema, req.query);
	const result = await PlaceService.nearby(query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Nearby places fetched successfully",
		data: result.items,
		meta: result.meta,
	});
});

const search = catchAsync(async (req: Request, res: Response) => {
	const query = parseQuery(PlaceValidation.SearchQueryZodSchema, req.query);
	const result = await PlaceService.search(query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Places fetched successfully",
		data: result.items,
		meta: result.meta,
	});
});

const getPlace = catchAsync(async (req: Request, res: Response) => {
	const placeId = req.params.placeId;

	if (typeof placeId !== "string" || !placeId) {
		throw new AppError(httpStatus.BAD_REQUEST, "Place id is required");
	}

	const result = await PlaceService.detail(placeId);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Place fetched successfully",
		data: result,
	});
});

const categories = catchAsync(async (_req: Request, res: Response) => {
	const result = await PlaceService.categories();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Place categories fetched successfully",
		data: result,
	});
});

export const PlaceController = {
	nearby,
	search,
	getPlace,
	categories,
};
