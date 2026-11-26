import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import type { IRequestUser } from "./auth.interface";
import { AuthService } from "./auth.service";

const cookieBase = {
	httpOnly: true,
	secure: false, // set to true in production (HTTPS)
	sameSite: "lax" as const,
};

const setAuthCookies = (
	res: Response,
	accessToken: string,
	refreshToken: string,
) => {
	res.cookie("accessToken", accessToken, {
		...cookieBase,
		maxAge: 1000 * 60 * 60 * 24,
	});
	res.cookie("refreshToken", refreshToken, {
		...cookieBase,
		maxAge: 1000 * 60 * 60 * 24 * 7,
	});
};

const registerUser = catchAsync(async (req: Request, res: Response) => {
	await AuthService.registerUsers(req.body);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Verification OTP sent",
		data: null,
	});
});

const verifyUserEmail = catchAsync(async (req: Request, res: Response) => {
	const { accessToken, refreshToken, user } =
		await AuthService.verifyUsersEmail(req.body);

	setAuthCookies(res, accessToken, refreshToken);

	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Email verified successfully",
		data: { accessToken, refreshToken, user },
	});
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
	const { accessToken, refreshToken } = await AuthService.loginUser(req.body);

	setAuthCookies(res, accessToken, refreshToken);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User logged in successfully",
		data: { accessToken, refreshToken },
	});
});

const getMe = catchAsync(async (req: Request, res: Response) => {
	const user = req.user as unknown as IRequestUser;

	if (!user) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"User information is missing in the request",
		);
	}

	const result = await AuthService.getMe(user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User profile fetched successfully",
		data: result,
	});
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
	if (!req.cookies.refreshToken) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Refresh token is missing");
	}

	const { accessToken, refreshToken: newRefreshToken } =
		await AuthService.refreshToken(req.cookies.refreshToken);

	setAuthCookies(res, accessToken, newRefreshToken);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "New tokens generated successfully",
		data: { accessToken, refreshToken: newRefreshToken },
	});
});

const googleLogin = catchAsync(async (req: Request, res: Response) => {
	const { accessToken, refreshToken } = await AuthService.googleLogin(req.body);

	setAuthCookies(res, accessToken, refreshToken);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Logged in with Google successfully",
		data: { accessToken, refreshToken },
	});
});

const forgotPassword = catchAsync(async (req: Request, res: Response) => {
	await AuthService.forgotPassword(req.body);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: `OTP sent to email: ${req.body.email}`,
		data: null,
	});
});

const resetPassword = catchAsync(async (req: Request, res: Response) => {
	await AuthService.resetPassword(req.body);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Password changed successfully",
		data: null,
	});
});

const logout = catchAsync(async (_req: Request, res: Response) => {
	const options = { ...cookieBase, path: "/" };

	res.clearCookie("accessToken", options);
	res.clearCookie("refreshToken", options);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "User logged out successfully",
		data: null,
	});
});

export const AuthController = {
	registerUser,
	verifyUserEmail,
	loginUser,
	getMe,
	refreshToken,
	googleLogin,
	forgotPassword,
	resetPassword,
	logout,
};
