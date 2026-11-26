import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { parsePagination } from "../../utils/pagination";
import { parseQuery } from "../../utils/parse";
import { sendResponse } from "../../utils/sendResponse";
import type { IUpdateSettingsPayload } from "./admin.interface";
import { AdminService } from "./admin.service";
import { AdminValidation } from "./admin.validation";

const getStats = catchAsync(async (_req: Request, res: Response) => {
	const result = await AdminService.getStats();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Admin statistics fetched successfully",
		data: result,
	});
});

const listAuditLogs = catchAsync(async (req: Request, res: Response) => {
	const pagination = parsePagination(req.query);
	const query = parseQuery(AdminValidation.AuditLogQueryZodSchema, req.query);
	const result = await AdminService.listAuditLogs(query, pagination);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Audit logs fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getSettings = catchAsync(async (_req: Request, res: Response) => {
	const result = AdminService.getSettings();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Settings fetched successfully",
		data: result,
	});
});

const updateSettings = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body as IUpdateSettingsPayload;
	const result = AdminService.updateSettings(payload);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Settings updated successfully",
		data: result,
	});
});

const clearCache = catchAsync(async (_req: Request, res: Response) => {
	const result = AdminService.clearCache();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Cache cleared successfully",
		data: result,
	});
});

const getHealth = catchAsync(async (_req: Request, res: Response) => {
	const result = await AdminService.getHealth();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Service health fetched successfully",
		data: result,
	});
});

const getVersion = catchAsync(async (_req: Request, res: Response) => {
	const result = AdminService.getVersion();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Service version fetched successfully",
		data: result,
	});
});

export const AdminController = {
	getStats,
	listAuditLogs,
	getSettings,
	updateSettings,
	clearCache,
	getHealth,
	getVersion,
};
