import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { PublicService } from "./public.service";

const getHome = catchAsync(async (_req: Request, res: Response) => {
	const result = await PublicService.getHome();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Homepage data fetched successfully",
		data: result,
	});
});

export const PublicController = {
	getHome,
};
