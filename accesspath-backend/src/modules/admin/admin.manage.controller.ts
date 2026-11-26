import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { parseQuery } from "../../utils/parse";
import { getRequestUser } from "../../utils/requestUser";
import { sendResponse } from "../../utils/sendResponse";
import { AdminManageService } from "./admin.manage.service";
import { AdminValidation } from "./admin.validation";

const param = (req: Request, key: string) => {
	const value = req.params[key];
	if (typeof value !== "string" || !value) {
		throw new AppError(httpStatus.BAD_REQUEST, `${key} is required`);
	}
	return value;
};

/* ------------------------------- users ------------------------------- */

const listUsers = catchAsync(async (req: Request, res: Response) => {
	const query = parseQuery(AdminValidation.UserListQueryZodSchema, req.query);
	const result = await AdminManageService.listUsers(query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Users fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

const updateUser = catchAsync(async (req: Request, res: Response) => {
	const actor = getRequestUser(req);
	const result = await AdminManageService.updateUser(
		actor.userId,
		param(req, "userId"),
		req.body,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User updated successfully",
		data: result,
	});
});

/* ----------------------------- categories ----------------------------- */

const listCategories = catchAsync(async (_req: Request, res: Response) => {
	const result = await AdminManageService.listCategories();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Categories fetched successfully",
		data: result,
	});
});

const createCategory = catchAsync(async (req: Request, res: Response) => {
	const actor = getRequestUser(req);
	const result = await AdminManageService.createCategory(
		actor.userId,
		req.body,
	);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Category created successfully",
		data: result,
	});
});

const updateCategory = catchAsync(async (req: Request, res: Response) => {
	const actor = getRequestUser(req);
	const result = await AdminManageService.updateCategory(
		actor.userId,
		param(req, "categoryId"),
		req.body,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Category updated successfully",
		data: result,
	});
});

const deleteCategory = catchAsync(async (req: Request, res: Response) => {
	const actor = getRequestUser(req);
	const result = await AdminManageService.deleteCategory(
		actor.userId,
		param(req, "categoryId"),
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: result.deactivated
			? "Category deactivated (still referenced by locations)"
			: "Category deleted",
		data: result,
	});
});

/* ------------------------------ locations ------------------------------ */

const listLocations = catchAsync(async (req: Request, res: Response) => {
	const query = parseQuery(
		AdminValidation.LocationListQueryZodSchema,
		req.query,
	);
	const result = await AdminManageService.listLocations(query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Locations fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

const updateLocation = catchAsync(async (req: Request, res: Response) => {
	const actor = getRequestUser(req);
	const result = await AdminManageService.updateLocation(
		actor.userId,
		param(req, "locationId"),
		req.body,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Location updated successfully",
		data: result,
	});
});

const updateAccessibility = catchAsync(async (req: Request, res: Response) => {
	const actor = getRequestUser(req);
	const result = await AdminManageService.updateLocationAccessibility(
		actor.userId,
		param(req, "locationId"),
		req.body,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Accessibility information updated successfully",
		data: result,
	});
});

const archiveLocation = catchAsync(async (req: Request, res: Response) => {
	const actor = getRequestUser(req);
	await AdminManageService.archiveLocation(
		actor.userId,
		param(req, "locationId"),
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Location archived",
		data: null,
	});
});

export const AdminManageController = {
	listUsers,
	updateUser,
	listCategories,
	createCategory,
	updateCategory,
	deleteCategory,
	listLocations,
	updateLocation,
	updateAccessibility,
	archiveLocation,
};
