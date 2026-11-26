import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { LocationService } from "./locations.service";
import { LocationValidation } from "./locations.validation";

const listLocations = catchAsync(async (req: Request, res: Response) => {
	const query = LocationValidation.ListLocationsQueryZodSchema.parse(
		req.query,
	);
	const result = await LocationService.listLocations(query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Locations fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getLocation = catchAsync(async (req: Request, res: Response) => {
	const locationId = req.params.locationId;

	if (typeof locationId !== "string" || !locationId) {
		throw new AppError(httpStatus.BAD_REQUEST, "Location id is required");
	}

	const result = await LocationService.getLocation(locationId);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Location fetched successfully",
		data: result,
	});
});

const listCities = catchAsync(async (_req: Request, res: Response) => {
	const result = await LocationService.listCities();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Cities fetched successfully",
		data: result,
	});
});

export const LocationController = {
	listLocations,
	getLocation,
	listCities,
};
