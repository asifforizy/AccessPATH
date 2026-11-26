import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { parsePagination } from "../../utils/pagination";
import { parseQuery } from "../../utils/parse";
import { getRequestUser } from "../../utils/requestUser";
import { sendResponse } from "../../utils/sendResponse";
import type {
	ICreateContributionPayload,
	IUpdateContributionPayload,
} from "./contributions.interface";
import { ContributionService } from "./contributions.service";
import { ContributionValidation } from "./contributions.validation";

const getContributionId = (req: Request): string => {
	const contributionId = req.params.contributionId;

	if (typeof contributionId !== "string" || !contributionId) {
		throw new AppError(httpStatus.BAD_REQUEST, "Contribution id is required");
	}

	return contributionId;
};

const listContributions = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const pagination = parsePagination(req.query);
	const query = parseQuery(
		ContributionValidation.ContributionListQueryZodSchema,
		req.query,
	);
	const result = await ContributionService.listContributions(
		user,
		query,
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

const createContribution = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const payload = req.body as ICreateContributionPayload;
	const result = await ContributionService.createContribution(
		user.userId,
		payload,
	);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Contribution created successfully",
		data: result,
	});
});

const getContribution = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const result = await ContributionService.getContribution(
		user,
		getContributionId(req),
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Contribution fetched successfully",
		data: result,
	});
});

const updateContribution = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const payload = req.body as IUpdateContributionPayload;
	const result = await ContributionService.updateContribution(
		user,
		getContributionId(req),
		payload,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Contribution updated successfully",
		data: result,
	});
});

const deleteContribution = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	await ContributionService.deleteContribution(user, getContributionId(req));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Contribution deleted successfully",
		data: null,
	});
});

const getMyContributions = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const pagination = parsePagination(req.query);
	const result = await ContributionService.getMyContributions(user, pagination);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "My contributions fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getStatistics = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const result = await ContributionService.getStatistics(user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Contribution statistics fetched successfully",
		data: result,
	});
});

const getHistory = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const result = await ContributionService.getContributionHistory(
		user,
		getContributionId(req),
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Contribution history fetched successfully",
		data: result,
	});
});

export const ContributionController = {
	listContributions,
	createContribution,
	getContribution,
	updateContribution,
	deleteContribution,
	getMyContributions,
	getStatistics,
	getHistory,
};
