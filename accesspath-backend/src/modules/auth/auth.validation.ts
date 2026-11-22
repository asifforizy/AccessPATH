import z from "zod";

const passwordSchema = z
	.string()
	.min(8, "Password must be minimum 8 characters long.")
	.regex(/[a-z]/, "Password must contain at least 1 lowercase letter")
	.regex(/[A-Z]/, "Password must contain at least 1 uppercase letter")
	.regex(/[0-9]/, "Password must contain at least 1 number")
	.regex(/[^A-Za-z0-9]/, "Password must contain at least 1 special character");

const UserRegistrationZodSchema = z.object({
	name: z
		.string("Name must be a string")
		.min(3, "Name must be at least 3 characters")
		.max(50),
	email: z.email("Invalid email"),
	password: passwordSchema,
});

const UserEmailVerifyZodSchema = z.object({
	email: z.email("Invalid email"),
	otp: z.string().length(6),
});

const LoginZodSchema = z.object({
	email: z.email(),
	password: z.string().min(1, "Password is required"), // don't enforce complexity on login
});

const ForgotPasswordZodSchema = z.object({
	email: z.email(),
});

const ResetPasswordZodSchema = z.object({
	email: z.email(),
	newPassword: passwordSchema,
	otp: z.string().length(6),
});

export const UserValidation = {
	UserRegistrationZodSchema,
	UserEmailVerifyZodSchema,
	LoginZodSchema,
	ForgotPasswordZodSchema,
	ResetPasswordZodSchema,
};
