import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { parsePagination } from "../../utils/pagination";
import { parseQuery } from "../../utils/parse";
import { getRequestUser } from "../../utils/requestUser";
import { sendResponse } from "../../utils/sendResponse";
import type {
	ICreateFeedbackPayload,
	ICreateLocationReviewPayload,
	IFlagFeedbackPayload,
	IUpdateFeedbackPayload,
} from "./feedback.interface";
import { FeedbackService } from "./feedback.service";
import { FeedbackValidation } from "./feedback.validation";

const getFeedbackId = (req: Request): string => {
	const feedbackId = req.params.feedbackId;

	if (typeof feedbackId !== "string" || !feedbackId) {
		throw new AppError(httpStatus.BAD_REQUEST, "Feedback id is required");
	}

	return feedbackId;
};

const getLocationId = (req: Request): string => {
	const locationId = req.params.locationId;

	if (typeof locationId !== "string" || !locationId) {
		throw new AppError(httpStatus.BAD_REQUEST, "Location id is required");
	}

	return locationId;
};

const listFeedback = catchAsync(async (req: Request, res: Response) => {
	const pagination = parsePagination(req.query);
	const query = parseQuery(
		FeedbackValidation.FeedbackListQueryZodSchema,
		req.query,
	);
	const result = await FeedbackService.listFeedback(query, pagination);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Feedback fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

const createFeedback = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const payload = req.body as ICreateFeedbackPayload;
	const result = await FeedbackService.createFeedback(user.userId, payload);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Feedback created successfully",
		data: result,
	});
});

const getFeedback = catchAsync(async (req: Request, res: Response) => {
	const result = await FeedbackService.getFeedback(getFeedbackId(req));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Feedback fetched successfully",
		data: result,
	});
});

const updateFeedback = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const payload = req.body as IUpdateFeedbackPayload;
	const result = await FeedbackService.updateFeedback(
		user,
		getFeedbackId(req),
		payload,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Feedback updated successfully",
		data: result,
	});
});

const deleteFeedback = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	await FeedbackService.deleteFeedback(user, getFeedbackId(req));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Feedback deleted successfully",
		data: null,
	});
});

const getLocationFeedback = catchAsync(async (req: Request, res: Response) => {
	const result = await FeedbackService.getLocationFeedback(getLocationId(req));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Location feedback summary fetched successfully",
		data: result,
	});
});

const getLocationReviews = catchAsync(async (req: Request, res: Response) => {
	const pagination = parsePagination(req.query);
	const result = await FeedbackService.getLocationReviews(
		getLocationId(req),
		pagination,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Location reviews fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

const createLocationReview = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const payload = req.body as ICreateLocationReviewPayload;
	const result = await FeedbackService.createLocationReview(
		user.userId,
		getLocationId(req),
		payload,
	);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Review created successfully",
		data: result,
	});
});

const flagFeedback = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const payload = req.body as IFlagFeedbackPayload;
	const result = await FeedbackService.flagFeedback(
		user,
		getFeedbackId(req),
		payload,
	);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Feedback flagged successfully",
		data: result,
	});
});

const markHelpful = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const result = await FeedbackService.markHelpful(
		user.userId,
		getFeedbackId(req),
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Feedback helpful vote updated successfully",
		data: result,
	});
});

export const FeedbackController = {
	listFeedback,
	createFeedback,
	getFeedback,
	updateFeedback,
	deleteFeedback,
	getLocationFeedback,
	getLocationReviews,
	createLocationReview,
	flagFeedback,
	markHelpful,
};
