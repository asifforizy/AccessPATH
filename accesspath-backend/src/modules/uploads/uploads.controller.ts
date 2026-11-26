import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { getRequestUser } from "../../utils/requestUser";
import { sendResponse } from "../../utils/sendResponse";
import type {
	IPresignedUrlPayload,
	IUploadImagePayload,
	IUploadMultiplePayload,
} from "./uploads.interface";
import { UploadService } from "./uploads.service";

const getMediaId = (req: Request): string => {
	const mediaId = req.params.mediaId;

	if (typeof mediaId !== "string" || !mediaId) {
		throw new AppError(httpStatus.BAD_REQUEST, "Media id is required");
	}

	return mediaId;
};

const createImage = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const payload = req.body as IUploadImagePayload;
	const result = await UploadService.createImage(user.userId, payload);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Image registered successfully",
		data: result,
	});
});

const createImages = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const payload = req.body as IUploadMultiplePayload;
	const result = await UploadService.createImages(user.userId, payload);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Images registered successfully",
		data: result,
	});
});

const getMedia = catchAsync(async (req: Request, res: Response) => {
	const result = await UploadService.getMedia(getMediaId(req));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Media fetched successfully",
		data: result,
	});
});

const deleteMedia = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	await UploadService.deleteMedia(user, getMediaId(req));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Media deleted successfully",
		data: null,
	});
});

const createPresignedUrl = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body as IPresignedUrlPayload;
	const result = UploadService.createPresignedUrl(payload);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Presigned upload URL generated successfully",
		data: result,
	});
});

export const UploadController = {
	createImage,
	createImages,
	getMedia,
	deleteMedia,
	createPresignedUrl,
};
