import type { Request, Response } from "express";
import httpStatus from "http-status";
import type {
	ContributionStatus,
	LocationStatus,
	ReportStatus,
} from "../../../prisma/generated/prisma/enums";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { parsePagination } from "../../utils/pagination";
import { parseQuery } from "../../utils/parse";
import { getRequestUser } from "../../utils/requestUser";
import { sendResponse } from "../../utils/sendResponse";
import type {
	IApprovePayload,
	IFlagPayload,
	IRejectPayload,
	IRequestChangesPayload,
	IVerifyPayload,
} from "./moderation.interface";
import { ModerationService } from "./moderation.service";
import { ModerationValidation } from "./moderation.validation";

const getSubmissionId = (req: Request): string => {
	const submissionId = req.params.submissionId;

	if (typeof submissionId !== "string" || !submissionId) {
		throw new AppError(httpStatus.BAD_REQUEST, "Submission id is required");
	}

	return submissionId;
};

const getQueue = catchAsync(async (req: Request, res: Response) => {
	const pagination = parsePagination(req.query);
	const result = await ModerationService.getQueue(pagination);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Moderation queue fetched successfully",
		data: result,
		meta: result.meta,
	});
});

const getLocations = catchAsync(async (req: Request, res: Response) => {
	const pagination = parsePagination(req.query);
	const status = req.query.status as LocationStatus | undefined;
	const result = await ModerationService.getLocations(status, pagination);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Moderation locations fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getReports = catchAsync(async (req: Request, res: Response) => {
	const pagination = parsePagination(req.query);
	const status = req.query.status as ReportStatus | undefined;
	const result = await ModerationService.getReports(status, pagination);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Moderation reports fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getContributions = catchAsync(async (req: Request, res: Response) => {
	const pagination = parsePagination(req.query);
	const status = req.query.status as ContributionStatus | undefined;
	const result = await ModerationService.getContributions(status, pagination);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Moderation contributions fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getFeedback = catchAsync(async (req: Request, res: Response) => {
	const pagination = parsePagination(req.query);
	const result = await ModerationService.getFeedback(pagination);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Moderation feedback fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getSubmission = catchAsync(async (req: Request, res: Response) => {
	const result = await ModerationService.getSubmission(getSubmissionId(req));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Submission fetched successfully",
		data: result,
	});
});

const approveSubmission = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const payload = req.body as IApprovePayload;
	const result = await ModerationService.approveSubmission(
		user,
		getSubmissionId(req),
		payload,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Submission approved successfully",
		data: result,
	});
});

const rejectSubmission = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const payload = req.body as IRejectPayload;
	const result = await ModerationService.rejectSubmission(
		user,
		getSubmissionId(req),
		payload,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Submission rejected successfully",
		data: result,
	});
});

const requestChanges = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const payload = req.body as IRequestChangesPayload;
	const result = await ModerationService.requestChanges(
		user,
		getSubmissionId(req),
		payload,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Changes requested successfully",
		data: result,
	});
});

const verifySubmission = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const payload = req.body as IVerifyPayload;
	const result = await ModerationService.verifySubmission(
		user,
		getSubmissionId(req),
		payload,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Submission verified successfully",
		data: result,
	});
});

const flagSubmission = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const payload = req.body as IFlagPayload;
	const result = await ModerationService.flagSubmission(
		user,
		getSubmissionId(req),
		payload,
	);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Submission flagged successfully",
		data: result,
	});
});

const getHistory = catchAsync(async (req: Request, res: Response) => {
	const pagination = parsePagination(req.query);
	const query = parseQuery(
		ModerationValidation.ModerationHistoryQueryZodSchema,
		req.query,
	);
	const result = await ModerationService.getHistory(query, pagination);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Moderation history fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getStatistics = catchAsync(async (_req: Request, res: Response) => {
	const result = await ModerationService.getStatistics();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Moderation statistics fetched successfully",
		data: result,
	});
});

export const ModerationController = {
	getQueue,
	getLocations,
	getReports,
	getContributions,
	getFeedback,
	getSubmission,
	approveSubmission,
	rejectSubmission,
	requestChanges,
	verifySubmission,
	flagSubmission,
	getHistory,
	getStatistics,
};
