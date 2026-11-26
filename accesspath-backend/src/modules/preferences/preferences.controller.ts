import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { parseQuery } from "../../utils/parse";
import { getUserId } from "../../utils/requestUser";
import { sendResponse } from "../../utils/sendResponse";
import type {
	IUpdateAccessibilityPayload,
	IUpdatePreferencesPayload,
} from "./preferences.interface";
import { PreferenceService } from "./preferences.service";
import { PreferenceValidation } from "./preferences.validation";

const getPreferences = catchAsync(async (req: Request, res: Response) => {
	const result = await PreferenceService.getPreferences(getUserId(req));

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Preferences fetched successfully",
		data: result,
	});
});

const updatePreferences = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body as IUpdatePreferencesPayload;
	const result = await PreferenceService.updatePreferences(
		getUserId(req),
		payload,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Preferences updated successfully",
		data: result,
	});
});

const getAccessibilityPreferences = catchAsync(
	async (req: Request, res: Response) => {
		const result = await PreferenceService.getAccessibilityPreferences(
			getUserId(req),
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Accessibility preferences fetched successfully",
			data: result,
		});
	},
);

const updateAccessibilityPreferences = catchAsync(
	async (req: Request, res: Response) => {
		const payload = req.body as IUpdateAccessibilityPayload;
		const result = await PreferenceService.updateAccessibilityPreferences(
			getUserId(req),
			payload,
		);

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Accessibility preferences updated successfully",
			data: result,
		});
	},
);

const getRecommendations = catchAsync(async (req: Request, res: Response) => {
	const query = parseQuery(
		PreferenceValidation.RecommendationsQueryZodSchema,
		req.query,
	);
	const result = await PreferenceService.getRecommendations(
		getUserId(req),
		query,
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Recommendations fetched successfully",
		data: result,
	});
});

export const PreferenceController = {
	getPreferences,
	updatePreferences,
	getAccessibilityPreferences,
	updateAccessibilityPreferences,
	getRecommendations,
};
