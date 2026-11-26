import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { parsePagination } from "../../utils/pagination";
import { parseQuery } from "../../utils/parse";
import { getUserId } from "../../utils/requestUser";
import { sendResponse } from "../../utils/sendResponse";
import { NotificationService } from "./notifications.service";
import { NotificationValidation } from "./notifications.validation";

const getNotificationId = (req: Request): string => {
	const notificationId = req.params.notificationId;

	if (typeof notificationId !== "string" || !notificationId) {
		throw new AppError(httpStatus.BAD_REQUEST, "Notification id is required");
	}

	return notificationId;
};

const listNotifications = catchAsync(async (req: Request, res: Response) => {
	const userId = getUserId(req);
	const pagination = parsePagination(req.query);
	const query = parseQuery(
		NotificationValidation.NotificationListQueryZodSchema,
		req.query,
	);
	const result = await NotificationService.listNotifications(
		userId,
		query,
		pagination,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Notifications fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getUnreadCount = catchAsync(async (req: Request, res: Response) => {
	const result = await NotificationService.getUnreadCount(getUserId(req));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Unread notification count fetched successfully",
		data: result,
	});
});

const markRead = catchAsync(async (req: Request, res: Response) => {
	const result = await NotificationService.markRead(
		getUserId(req),
		getNotificationId(req),
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Notification marked as read",
		data: result,
	});
});

const markAllRead = catchAsync(async (req: Request, res: Response) => {
	const result = await NotificationService.markAllRead(getUserId(req));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "All notifications marked as read",
		data: result,
	});
});

const deleteNotification = catchAsync(async (req: Request, res: Response) => {
	await NotificationService.deleteNotification(
		getUserId(req),
		getNotificationId(req),
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Notification deleted successfully",
		data: null,
	});
});

const clearAll = catchAsync(async (req: Request, res: Response) => {
	const result = await NotificationService.clearAll(getUserId(req));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "All notifications deleted successfully",
		data: result,
	});
});

export const NotificationController = {
	listNotifications,
	getUnreadCount,
	markRead,
	markAllRead,
	deleteNotification,
	clearAll,
};
