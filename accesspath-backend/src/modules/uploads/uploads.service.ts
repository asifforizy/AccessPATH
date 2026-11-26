import crypto from "node:crypto";
import httpStatus from "http-status";
import { UserRole } from "../../../prisma/generated/prisma/enums";
import config from "../../config";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { AppError } from "../../utils/AppError";
import type {
	IPresignedUrlPayload,
	IUploadImagePayload,
	IUploadMultiplePayload,
} from "./uploads.interface";

const createImage = async (userId: string, payload: IUploadImagePayload) => {
	if (payload.locationId) {
		const location = await prisma.location.findFirst({
			where: { id: payload.locationId, deletedAt: null },
			select: { id: true },
		});

		if (!location) {
			throw new AppError(httpStatus.NOT_FOUND, "Location not found");
		}

		if (payload.isPrimary) {
			await prisma.locationPhoto.updateMany({
				where: { locationId: payload.locationId },
				data: { isPrimary: false },
			});
		}

		const photo = await prisma.locationPhoto.create({
			data: {
				url: payload.url,
				publicId: payload.publicId ?? null,
				locationId: payload.locationId,
				uploadedById: userId,
				isPrimary: payload.isPrimary ?? false,
			},
		});

		return { kind: "location" as const, photo };
	}

	if (!payload.reportId) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Exactly one of locationId or reportId is required",
		);
	}

	const report = await prisma.accessibilityReport.findUnique({
		where: { id: payload.reportId },
		select: { id: true },
	});

	if (!report) {
		throw new AppError(httpStatus.NOT_FOUND, "Report not found");
	}

	const photo = await prisma.reportPhoto.create({
		data: {
			url: payload.url,
			publicId: payload.publicId ?? null,
			reportId: payload.reportId,
		},
	});

	return { kind: "report" as const, photo };
};

const createImages = async (
	userId: string,
	payload: IUploadMultiplePayload,
) => {
	const results: Awaited<ReturnType<typeof createImage>>[] = [];

	for (const item of payload.items) {
		results.push(await createImage(userId, item));
	}

	return results;
};

const getMedia = async (mediaId: string) => {
	const locationPhoto = await prisma.locationPhoto.findUnique({
		where: { id: mediaId },
		include: {
			location: { select: { id: true, name: true, slug: true } },
		},
	});

	if (locationPhoto) {
		return { kind: "location" as const, media: locationPhoto };
	}

	const reportPhoto = await prisma.reportPhoto.findUnique({
		where: { id: mediaId },
		include: {
			report: { select: { id: true, locationId: true, status: true } },
		},
	});

	if (reportPhoto) {
		return { kind: "report" as const, media: reportPhoto };
	}

	throw new AppError(httpStatus.NOT_FOUND, "Media not found");
};

const deleteMedia = async (user: RequestUser, mediaId: string) => {
	const locationPhoto = await prisma.locationPhoto.findUnique({
		where: { id: mediaId },
		select: { id: true, uploadedById: true },
	});

	if (locationPhoto) {
		if (
			locationPhoto.uploadedById &&
			locationPhoto.uploadedById !== user.userId &&
			user.role !== UserRole.ADMIN
		) {
			throw new AppError(httpStatus.FORBIDDEN, "You cannot delete this media");
		}

		await prisma.locationPhoto.delete({ where: { id: mediaId } });
		return null;
	}

	const reportPhoto = await prisma.reportPhoto.findUnique({
		where: { id: mediaId },
		select: { id: true },
	});

	if (!reportPhoto) {
		throw new AppError(httpStatus.NOT_FOUND, "Media not found");
	}

	await prisma.reportPhoto.delete({ where: { id: mediaId } });

	return null;
};

const createPresignedUrl = (payload: IPresignedUrlPayload) => {
	const extension = payload.fileName.split(".").pop() ?? "bin";
	const key = `${payload.folder ?? "uploads"}/${Date.now()}-${crypto
		.randomBytes(6)
		.toString("hex")}.${extension}`;

	return {
		uploadUrl: `${config.app_url}/api/v1/uploads/images`,
		method: "POST",
		key,
		publicId: key,
		fields: {
			url: `${config.app_url}/media/${key}`,
			publicId: key,
			contentType: payload.contentType,
		},
		expiresInSeconds: 900,
		note: "Storage is not configured. Upload the file to your provider, then register its URL via POST /uploads/images.",
	};
};

export const UploadService = {
	createImage,
	createImages,
	getMedia,
	deleteMedia,
	createPresignedUrl,
};
