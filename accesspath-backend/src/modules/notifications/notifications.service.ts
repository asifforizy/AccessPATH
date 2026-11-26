import httpStatus from "http-status";
import type { Prisma } from "../../../prisma/generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
	buildMeta,
	getPaginationArgs,
	type IPagination,
} from "../../utils/pagination";
import type { INotificationListQuery } from "./notifications.interface";

const listNotifications = async (
	userId: string,
	query: INotificationListQuery,
	pagination: IPagination,
) => {
	const where: Prisma.NotificationWhereInput = {
		userId,
		...(query.isRead === undefined ? {} : { isRead: query.isRead }),
	};

	const [data, total] = await Promise.all([
		prisma.notification.findMany({
			where,
			orderBy: { createdAt: "desc" },
			...getPaginationArgs(pagination),
		}),
		prisma.notification.count({ where }),
	]);

	return {
		data,
		meta: buildMeta(total, pagination.page, pagination.limit),
	};
};

const getUnreadCount = async (userId: string) => {
	const count = await prisma.notification.count({
		where: { userId, isRead: false },
	});

	return { unreadCount: count };
};

const markRead = async (userId: string, notificationId: string) => {
	const result = await prisma.notification.updateMany({
		where: { id: notificationId, userId },
		data: { isRead: true },
	});

	if (result.count === 0) {
		throw new AppError(httpStatus.NOT_FOUND, "Notification not found");
	}

	return prisma.notification.findUnique({ where: { id: notificationId } });
};

const markAllRead = async (userId: string) => {
	const result = await prisma.notification.updateMany({
		where: { userId, isRead: false },
		data: { isRead: true },
	});

	return { updated: result.count };
};

const deleteNotification = async (userId: string, notificationId: string) => {
	const result = await prisma.notification.deleteMany({
		where: { id: notificationId, userId },
	});

	if (result.count === 0) {
		throw new AppError(httpStatus.NOT_FOUND, "Notification not found");
	}

	return null;
};

const clearAll = async (userId: string) => {
	const result = await prisma.notification.deleteMany({ where: { userId } });

	return { deleted: result.count };
};

export const NotificationService = {
	listNotifications,
	getUnreadCount,
	markRead,
	markAllRead,
	deleteNotification,
	clearAll,
};
