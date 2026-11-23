import type { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import type { JwtPayload } from "jsonwebtoken";
import config from "../config";
import { prisma } from "../lib/prisma";
import { type UserRole, UserStatus } from "../../prisma/generated/prisma/enums";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../utils/AppError";
import { jwtUtils } from "../utils/jwt";

export interface RequestUser {
	email: string;
	name: string;
	userId: string;
	role: UserRole;
}

declare global {
	namespace Express {
		interface Request {
			user?: RequestUser;
		}
	}
}

export const auth = (...requiredRoles: UserRole[]) => {
	return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
		const token = req.cookies.accessToken
			? req.cookies.accessToken
			: req.headers.authorization?.startsWith("Bearer ")
				? req.headers.authorization.split(" ")[1]
				: req.headers.authorization;

		if (!token) {
			throw new AppError(
				httpStatus.UNAUTHORIZED,
				"You are not logged in. Please log in to access this resource.",
			);
		}

		const verifiedToken = jwtUtils.verifyToken(token, config.jwt_access_secret);

		if (!verifiedToken.success) {
			throw new AppError(httpStatus.UNAUTHORIZED, verifiedToken.error);
		}

		const { userId } = verifiedToken.data as JwtPayload & {
			userId?: string;
		};

		if (!userId) {
			throw new AppError(
				httpStatus.UNAUTHORIZED,
				"Invalid token payload. Please log in again.",
			);
		}

		const user = await prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			throw new AppError(
				httpStatus.UNAUTHORIZED,
				"User not found. Please log in again.",
			);
		}

		if (user.deletedAt) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"Your account has been deleted. Please contact support.",
			);
		}

		if (user.status !== UserStatus.ACTIVE) {
			const statusMessages: Record<UserStatus, string> = {
				[UserStatus.ACTIVE]: "Your account is active.",
				[UserStatus.INACTIVE]:
					"Your account is inactive. Please contact support.",
				[UserStatus.SUSPENDED]:
					"Your account has been suspended. Please contact support.",
				[UserStatus.DELETED]:
					"Your account has been deleted. Please contact support.",
			};

			throw new AppError(httpStatus.FORBIDDEN, statusMessages[user.status]);
		}

		if (requiredRoles.length && !requiredRoles.includes(user.role)) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"Forbidden. You don't have permission to access this resource.",
			);
		}

		req.user = {
			email: user.email,
			name: user.name,
			userId: user.id,
			role: user.role,
		};

		next();
	});
};
