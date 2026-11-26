import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { parsePagination } from "../../utils/pagination";
import { parseQuery } from "../../utils/parse";
import { getRequestUser } from "../../utils/requestUser";
import { sendResponse } from "../../utils/sendResponse";
import type {
	IAddAttachmentsPayload,
	ICreateReportPayload,
	IUpdateReportPayload,
} from "./reports.interface";
import { ReportService } from "./reports.service";
import { ReportValidation } from "./reports.validation";

const getReportId = (req: Request): string => {
	const reportId = req.params.reportId;

	if (typeof reportId !== "string" || !reportId) {
		throw new AppError(httpStatus.BAD_REQUEST, "Report id is required");
	}

	return reportId;
};

const listReports = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const pagination = parsePagination(req.query);
	const query = parseQuery(
		ReportValidation.ReportListQueryZodSchema,
		req.query,
	);
	const result = await ReportService.listReports(user, query, pagination);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Reports fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

const createReport = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const payload = req.body as ICreateReportPayload;
	const result = await ReportService.createReport(user.userId, payload);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Report created successfully",
		data: result,
	});
});

const getReport = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const result = await ReportService.getReport(user, getReportId(req));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Report fetched successfully",
		data: result,
	});
});

const updateReport = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const payload = req.body as IUpdateReportPayload;
	const result = await ReportService.updateReport(
		user,
		getReportId(req),
		payload,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Report updated successfully",
		data: result,
	});
});

const deleteReport = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	await ReportService.deleteReport(user, getReportId(req));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Report deleted successfully",
		data: null,
	});
});

const getMyReports = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const pagination = parsePagination(req.query);
	const result = await ReportService.getMyReports(user, pagination);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "My reports fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getNearby = catchAsync(async (req: Request, res: Response) => {
	const query = parseQuery(ReportValidation.NearbyQueryZodSchema, req.query);
	const result = await ReportService.getNearbyReports(query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Nearby reports fetched successfully",
		data: result,
	});
});

const getHistory = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const result = await ReportService.getReportHistory(user, getReportId(req));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Report history fetched successfully",
		data: result,
	});
});

const addAttachments = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const payload = req.body as IAddAttachmentsPayload;
	const result = await ReportService.addAttachments(
		user,
		getReportId(req),
		payload,
	);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Report attachments added successfully",
		data: result,
	});
});

const getVerification = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const result = await ReportService.getVerification(user, getReportId(req));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Report verification fetched successfully",
		data: result,
	});
});

export const ReportController = {
	listReports,
	createReport,
	getReport,
	updateReport,
	deleteReport,
	getMyReports,
	getNearby,
	getHistory,
	addAttachments,
	getVerification,
};
