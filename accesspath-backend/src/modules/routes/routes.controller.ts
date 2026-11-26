import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { getRequestUser } from "../../utils/requestUser";
import { sendResponse } from "../../utils/sendResponse";
import type {
	IAlternativesPayload,
	IFeedbackPayload,
	IPlanPayload,
	IPreferencesPayload,
	IScorePayload,
	IValidatePayload,
} from "./routes.interface";
import { RouteService } from "./routes.service";

const getRouteId = (req: Request): string => {
	const routeId = req.params.routeId;

	if (typeof routeId !== "string" || !routeId) {
		throw new AppError(httpStatus.BAD_REQUEST, "Route id is required");
	}

	return routeId;
};

const getRadius = (req: Request, fallback: number): number => {
	const raw = req.query.radiusMeters;

	if (raw === undefined) {
		return fallback;
	}

	const radius = Number(raw);

	if (!Number.isFinite(radius) || radius < 100 || radius > 10_000) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"radiusMeters must be between 100 and 10000",
		);
	}

	return radius;
};

const planRoute = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const payload = req.body as IPlanPayload;
	const result = await RouteService.planRoute(user.userId, payload);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Route planned successfully",
		data: result,
	});
});

const getAlternatives = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body as IAlternativesPayload;
	const result = RouteService.getAlternatives(payload);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Alternative routes generated successfully",
		data: result,
	});
});

const getRoute = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const result = await RouteService.getRoute(
		user.userId,
		user.role,
		getRouteId(req),
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Route fetched successfully",
		data: result,
	});
});

const getBarriers = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const result = await RouteService.getBarriers(
		user.userId,
		user.role,
		getRouteId(req),
		getRadius(req, 2_000),
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Route barriers fetched successfully",
		data: result,
	});
});

const getAccessibility = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const result = await RouteService.getRouteAccessibility(
		user.userId,
		user.role,
		getRouteId(req),
	);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Route accessibility fetched successfully",
		data: result,
	});
});

const scoreRoute = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const payload = req.body as IScorePayload;
	const result = await RouteService.scoreRoute(user.userId, user.role, payload);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Route accessibility score calculated successfully",
		data: result,
	});
});

const addFeedback = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const payload = req.body as IFeedbackPayload;
	const result = await RouteService.addRouteFeedback(
		user.userId,
		user.role,
		getRouteId(req),
		payload,
	);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Route feedback submitted successfully",
		data: result,
	});
});

const validateRoute = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body as IValidatePayload;
	const result = RouteService.validateRoute(payload);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Route validated successfully",
		data: result,
	});
});

const getPreferences = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const result = await RouteService.getPreferences(user.userId);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Route preferences fetched successfully",
		data: result,
	});
});

const updatePreferences = catchAsync(async (req: Request, res: Response) => {
	const user = getRequestUser(req);
	const payload = req.body as IPreferencesPayload;
	const result = await RouteService.updatePreferences(user.userId, payload);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Route preferences updated successfully",
		data: result,
	});
});

export const RouteController = {
	planRoute,
	getAlternatives,
	getRoute,
	getBarriers,
	getAccessibility,
	scoreRoute,
	addFeedback,
	validateRoute,
	getPreferences,
	updatePreferences,
};
