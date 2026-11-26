import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { parseQuery } from "../../utils/parse";
import { sendResponse } from "../../utils/sendResponse";
import { AnalyticsService } from "./analytics.service";
import { AnalyticsValidation } from "./analytics.validation";

const getOverview = catchAsync(async (_req: Request, res: Response) => {
	const result = await AnalyticsService.getOverview();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Analytics overview fetched successfully",
		data: result,
	});
});

const getLocations = catchAsync(async (_req: Request, res: Response) => {
	const result = await AnalyticsService.getLocationAnalytics();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Location analytics fetched successfully",
		data: result,
	});
});

const getReports = catchAsync(async (_req: Request, res: Response) => {
	const result = await AnalyticsService.getReportAnalytics();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Report analytics fetched successfully",
		data: result,
	});
});

const getContributions = catchAsync(async (_req: Request, res: Response) => {
	const result = await AnalyticsService.getContributionAnalytics();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Contribution analytics fetched successfully",
		data: result,
	});
});

const getUsers = catchAsync(async (_req: Request, res: Response) => {
	const result = await AnalyticsService.getUserAnalytics();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User analytics fetched successfully",
		data: result,
	});
});

const getModeration = catchAsync(async (_req: Request, res: Response) => {
	const result = await AnalyticsService.getModerationAnalytics();

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Moderation analytics fetched successfully",
		data: result,
	});
});

const getMonthlyTrends = catchAsync(async (req: Request, res: Response) => {
	const query = parseQuery(
		AnalyticsValidation.MonthlyTrendsQueryZodSchema,
		req.query,
	);
	const result = await AnalyticsService.getMonthlyTrends(query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Monthly trends fetched successfully",
		data: result,
	});
});

const getTopBarrierAreas = catchAsync(async (req: Request, res: Response) => {
	const query = parseQuery(
		AnalyticsValidation.TopAreasQueryZodSchema,
		req.query,
	);
	const result = await AnalyticsService.getTopBarrierAreas(query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Top barrier areas fetched successfully",
		data: result,
	});
});

const getCategoryDistribution = catchAsync(
	async (_req: Request, res: Response) => {
		const result = await AnalyticsService.getCategoryDistribution();

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Category distribution fetched successfully",
			data: result,
		});
	},
);

const getAccessibilityDistribution = catchAsync(
	async (_req: Request, res: Response) => {
		const result = await AnalyticsService.getAccessibilityDistribution();

		sendResponse(res, {
			statusCode: httpStatus.OK,
			success: true,
			message: "Accessibility distribution fetched successfully",
			data: result,
		});
	},
);

const getHeatmap = catchAsync(async (req: Request, res: Response) => {
	const query = parseQuery(
		AnalyticsValidation.HeatmapQueryZodSchema,
		req.query,
	);
	const result = await AnalyticsService.getHeatmap(query);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Heatmap data fetched successfully",
		data: result,
	});
});

export const AnalyticsController = {
	getOverview,
	getLocations,
	getReports,
	getContributions,
	getUsers,
	getModeration,
	getMonthlyTrends,
	getTopBarrierAreas,
	getCategoryDistribution,
	getAccessibilityDistribution,
	getHeatmap,
};
