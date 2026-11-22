import bcrypt from "bcryptjs";
import crypto from "crypto";
import path from "path";
import ejs from "ejs";
import httpStatus from "http-status";
import type { JwtPayload, SignOptions } from "jsonwebtoken";
import { OAuth2Client, type TokenPayload } from "google-auth-library";

import { prisma } from "../../lib/prisma";
import { redisClient } from "../../lib/redis";
import { transporter } from "../../lib/nodemailer";
import { AppError } from "../../utils/AppError";
import { jwtUtils } from "../../utils/jwt"; // <-- adjust to wherever your jwtUtils lives
import config from "../../config";

import type {
	IForgotPasswordPayload,
	IGoogleLoginPayload,
	ILoginUserPayload,
	IRegisterUsersPayload,
	IRequestUser,
	IResetPasswordPayload,
	IVerifyEmailPayload,
} from "./auth.interface";
import { UserRole, UserStatus } from "../../../prisma/generated/prisma/enums";

const googleClient = new OAuth2Client(config.google_client_id);

const OTP_TTL_SECONDS = 5 * 60;
const registrationOtpKey = (email: string) => `registration-otp:${email}`;
const registrationDataKey = (email: string) => `registration-data:${email}`;
const forgotPasswordOtpKey = (email: string) => `forgot-password-otp:${email}`;

// ---------- helpers ----------

const sendTemplateMail = async (
	template: string,
	data: Record<string, unknown>,
	to: string,
	subject: string,
) => {
	const templatePath = path.join(process.cwd(), "src/templates", template);
	const html = await ejs.renderFile(templatePath, data);
	await transporter.sendMail({ from: config.email_sender, to, subject, html });
};

const generateOtp = () => crypto.randomInt(100000, 1000000).toString();

const createTokens = (user: {
	id: string;
	name: string;
	email: string;
	role: UserRole;
}) => {
	const jwtPayload = {
		userId: user.id,
		name: user.name,
		email: user.email,
		role: user.role,
	};

	const accessToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_access_secret,
		config.jwt_access_expires_in as SignOptions,
	);
	const refreshToken = jwtUtils.createToken(
		jwtPayload,
		config.jwt_refresh_secret,
		config.jwt_refresh_expires_in as SignOptions,
	);

	return { accessToken, refreshToken };
};

const assertUserCanAuthenticate = (user: {
	status: UserStatus;
	deletedAt: Date | null;
}) => {
	if (user.deletedAt || user.status === UserStatus.DELETED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is deleted");
	}
	if (user.status === UserStatus.SUSPENDED) {
		throw new AppError(httpStatus.FORBIDDEN, "User is suspended");
	}
	if (user.status === UserStatus.INACTIVE) {
		throw new AppError(httpStatus.FORBIDDEN, "User is inactive");
	}
};

// ---------- register ----------

const registerUsers = async (payload: IRegisterUsersPayload) => {
	const { name, password } = payload;
	const email = payload.email.trim().toLowerCase();

	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) {
		throw new AppError(
			httpStatus.CONFLICT,
			"User with this email already exists",
		);
	}

	const hashedPassword = await bcrypt.hash(
		password,
		Number(config.bycrypt_salt),
	);
	const otp = generateOtp();

	if (config.node_env === "development") {
		console.log(`[dev] Registration OTP for ${email}: ${otp}`);
	}

	await redisClient.set(registrationOtpKey(email), otp, {
		expiration: { type: "EX", value: OTP_TTL_SECONDS },
	});

	await redisClient.set(
		registrationDataKey(email),
		JSON.stringify({ name, email, password: hashedPassword }),
		{ expiration: { type: "EX", value: OTP_TTL_SECONDS } },
	);

	await sendTemplateMail(
		"registration-user-otp.ejs",
		{ name, email, otp, expirationMinutes: OTP_TTL_SECONDS / 60 },
		email,
		"Email Verification",
	);
};

// ---------- verify email ----------

const verifyUsersEmail = async (payload: IVerifyEmailPayload) => {
	const email = payload.email.trim().toLowerCase();

	const existing = await prisma.user.findUnique({ where: { email } });
	if (existing) {
		throw new AppError(httpStatus.CONFLICT, "Email already verified");
	}

	const redisOtp = await redisClient.get(registrationOtpKey(email));
	if (!redisOtp) {
		throw new AppError(httpStatus.BAD_REQUEST, "OTP expired or invalid");
	}
	if (redisOtp !== payload.otp) {
		throw new AppError(httpStatus.BAD_REQUEST, "OTP does not match");
	}

	const redisData = await redisClient.get(registrationDataKey(email));
	if (!redisData) {
		throw new AppError(
			httpStatus.NOT_FOUND,
			"Registration data expired. Please register again.",
		);
	}

	const data: { name: string; email: string; password: string } =
		JSON.parse(redisData);

	const user = await prisma.user.create({
		data: {
			name: data.name,
			email: data.email,
			password: data.password,
			role: UserRole.USER,
			status: UserStatus.ACTIVE,
			emailVerifiedAt: new Date(),
			preference: { create: {} },
		},
		omit: { password: true },
	});

	await redisClient.del([
		registrationOtpKey(email),
		registrationDataKey(email),
	]);

	await sendTemplateMail(
		"user-welcome-email.ejs",
		{ name: user.name },
		email,
		"Welcome To Our System",
	);

	const { accessToken, refreshToken } = createTokens(user);

	return { user, accessToken, refreshToken };
};

// ---------- login ----------

const loginUser = async (payload: ILoginUserPayload) => {
	const email = payload.email.trim().toLowerCase();

	const user = await prisma.user.findUnique({
		where: { email },
		include: { oauthAccounts: { select: { provider: true } } },
	});

	// same message for "not found" and "wrong password" to avoid leaking which emails exist
	if (!user) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid credentials");
	}

	assertUserCanAuthenticate(user);

	if (!user.password) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"This account was created with Google. Please log in with Google.",
		);
	}

	if (!user.emailVerifiedAt) {
		throw new AppError(httpStatus.FORBIDDEN, "Email not verified");
	}

	const isPasswordMatched = await bcrypt.compare(
		payload.password,
		user.password,
	);
	if (!isPasswordMatched) {
		throw new AppError(httpStatus.UNAUTHORIZED, "Invalid credentials");
	}

	return createTokens(user);
};

// ---------- me ----------

const getMe = async (user: IRequestUser) => {
	const result = await prisma.user.findUnique({
		where: { id: user.userId },
		include: { preference: true },
		omit: { password: true },
	});

	if (!result) {
		throw new AppError(httpStatus.NOT_FOUND, "User not found");
	}

	return result;
};

// ---------- refresh token ----------

const refreshToken = async (token: string) => {
	const verified = jwtUtils.verifyToken(token, config.jwt_refresh_secret);

	if (!verified.success || !verified.data) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			config.node_env === "development"
				? verified.error
				: "Invalid refresh token",
		);
	}

	const data = verified.data as JwtPayload;

	const user = await prisma.user.findUnique({ where: { id: data.userId } });

	if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"User is inactive or not found",
		);
	}

	return createTokens(user);
};

// ---------- google login ----------

const googleLogin = async (payload: IGoogleLoginPayload) => {
	let googlePayload: TokenPayload | undefined;

	try {
		const ticket = await googleClient.verifyIdToken({
			idToken: payload.idToken,
			audience: config.google_client_id,
		});
		googlePayload = ticket.getPayload();
	} catch (error) {
		console.log("Google ID token verification failed", error);
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Invalid or expired Google ID token",
		);
	}

	if (!googlePayload) {
		throw new AppError(
			httpStatus.UNAUTHORIZED,
			"Invalid or expired Google ID token",
		);
	}
	if (!googlePayload.email) {
		throw new AppError(httpStatus.BAD_REQUEST, "Google email not found");
	}
	if (!googlePayload.sub) {
		throw new AppError(httpStatus.BAD_REQUEST, "Google user id not found");
	}
	if (!googlePayload.email_verified) {
		throw new AppError(httpStatus.FORBIDDEN, "Google email is not verified");
	}

	const email = googlePayload.email.trim().toLowerCase();
	const name = googlePayload.name ?? email.split("@")[0]!;
	const googleId = googlePayload.sub;

	// 1) already linked Google account?
	const oauthAccount = await prisma.oAuthAccount.findUnique({
		where: {
			provider_providerAccountId: {
				provider: "google",
				providerAccountId: googleId,
			},
		},
		include: { user: true },
	});

	let user = oauthAccount?.user ?? null;
	let isNewUser = false;

	if (!user) {
		// 2) same email already registered -> link Google to it
		const existing = await prisma.user.findUnique({ where: { email } });

		if (existing) {
			user = await prisma.user.update({
				where: { id: existing.id },
				data: {
					emailVerifiedAt: existing.emailVerifiedAt ?? new Date(),
					image: existing.image ?? googlePayload.picture,
					oauthAccounts: {
						create: {
							provider: "google",
							providerAccountId: googleId,
							providerEmail: email,
						},
					},
				},
			});
		} else {
			// 3) brand new user
			user = await prisma.user.create({
				data: {
					name,
					email,
					image: googlePayload.picture,
					role: UserRole.USER,
					emailVerifiedAt: new Date(),
					preference: { create: {} },
					oauthAccounts: {
						create: {
							provider: "google",
							providerAccountId: googleId,
							providerEmail: email,
						},
					},
				},
			});
			isNewUser = true;
		}
	}

	assertUserCanAuthenticate(user);

	if (isNewUser) {
		await sendTemplateMail(
			"user-welcome-email.ejs",
			{ name: user.name },
			user.email,
			"Welcome To Our System",
		);
	}

	return createTokens(user);
};

// ---------- forgot / reset password ----------

const getPasswordResetUser = async (email: string) => {
	const user = await prisma.user.findUnique({ where: { email } });

	if (!user) {
		throw new AppError(httpStatus.NOT_FOUND, "User does not exist");
	}

	assertUserCanAuthenticate(user);

	if (!user.emailVerifiedAt) {
		throw new AppError(httpStatus.FORBIDDEN, "User not verified");
	}
	if (!user.password) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"This account uses Google login and has no password",
		);
	}

	return user;
};

const forgotPassword = async (payload: IForgotPasswordPayload) => {
	const email = payload.email.trim().toLowerCase();
	const user = await getPasswordResetUser(email);

	const otp = generateOtp();

	if (config.node_env === "development") {
		console.log(`[dev] Forgot-password OTP for ${email}: ${otp}`);
	}

	await redisClient.set(forgotPasswordOtpKey(user.email), otp, {
		expiration: { type: "EX", value: OTP_TTL_SECONDS },
	});

	await sendTemplateMail(
		"forgot-password.ejs",
		{ name: user.name, otp, expirationMinutes: OTP_TTL_SECONDS / 60 },
		user.email,
		"Forgot Password",
	);
};

const resetPassword = async (payload: IResetPasswordPayload) => {
	const email = payload.email.trim().toLowerCase();
	const user = await getPasswordResetUser(email);

	const key = forgotPasswordOtpKey(user.email);
	const redisOtp = await redisClient.get(key);

	if (!redisOtp) {
		throw new AppError(httpStatus.BAD_REQUEST, "OTP expired or invalid");
	}
	if (redisOtp !== payload.otp) {
		throw new AppError(httpStatus.BAD_REQUEST, "OTP does not match");
	}

	const hashedNewPassword = await bcrypt.hash(
		payload.newPassword,
		Number(config.bycrypt_salt),
	);

	await prisma.user.update({
		where: { id: user.id },
		data: { password: hashedNewPassword },
	});

	await redisClient.del([key]);

	await sendTemplateMail(
		"reset-password-success.ejs",
		{ name: user.name },
		user.email,
		"Password Changed",
	);
};

export const AuthService = {
	registerUsers,
	verifyUsersEmail,
	loginUser,
	getMe,
	refreshToken,
	googleLogin,
	forgotPassword,
	resetPassword,
};
