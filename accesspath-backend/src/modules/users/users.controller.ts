import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { UsersService } from "./users.service";
import {
	type IAvatarPayload,
	type IUpdateMePayload,
	UserValidation,
} from "./users.validation";

const getCurrentUserId = (req: Request): string => {
	if (!req.user) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"User information is missing in the request",
		);
	}

	return req.user.userId;
};

const getMe = catchAsync(async (req: Request, res: Response) => {
	const result = await UsersService.getMe(getCurrentUserId(req));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User profile fetched successfully",
		data: result,
	});
});

const updateMe = catchAsync(async (req: Request, res: Response) => {
	const payload: IUpdateMePayload = req.body;
	const result = await UsersService.updateMe(getCurrentUserId(req), payload);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User profile updated successfully",
		data: result,
	});
});

const deleteMe = catchAsync(async (req: Request, res: Response) => {
	await UsersService.deleteMe(getCurrentUserId(req));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User account deleted successfully",
		data: null,
	});
});

const updateAvatar = catchAsync(async (req: Request, res: Response) => {
	const payload: IAvatarPayload = req.body;
	const result = await UsersService.updateAvatar(
		getCurrentUserId(req),
		payload,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User avatar updated successfully",
		data: result,
	});
});

const getMyContributions = catchAsync(async (req: Request, res: Response) => {
	const pagination = UserValidation.parsePaginationQuery(req.query);
	const result = await UsersService.getMyContributions(
		getCurrentUserId(req),
		pagination,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Contributions fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getMyReports = catchAsync(async (req: Request, res: Response) => {
	const pagination = UserValidation.parsePaginationQuery(req.query);
	const result = await UsersService.getMyReports(
		getCurrentUserId(req),
		pagination,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Reports fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getMyActivity = catchAsync(async (req: Request, res: Response) => {
	const pagination = UserValidation.parsePaginationQuery(req.query);
	const result = await UsersService.getMyActivity(
		getCurrentUserId(req),
		pagination,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Activity fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

export const UsersController = {
	getMe,
	updateMe,
	deleteMe,
	updateAvatar,
	getMyContributions,
	getMyReports,
	getMyActivity,
};
