import type { Request } from "express";
import httpStatus from "http-status";
import type { RequestUser } from "../middleware/checkAuth";
import { AppError } from "./AppError";

export const getRequestUser = (req: Request): RequestUser => {
	if (!req.user) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"User information is missing in the request",
		);
	}

	return req.user;
};

export const getUserId = (req: Request): string => getRequestUser(req).userId;
