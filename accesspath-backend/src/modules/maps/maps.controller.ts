import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { parseQuery } from "../../utils/parse";
import { sendResponse } from "../../utils/sendResponse";
import { MapService } from "./maps.service";
import { MapValidation } from "./maps.validation";

const explore = catchAsync(async (req: Request, res: Response) => {
	const query = parseQuery(MapValidation.ExploreQueryZodSchema, req.query);
	const result = await MapService.explore(query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Map locations fetched successfully",
		data: result,
	});
});

export const MapController = { explore };
