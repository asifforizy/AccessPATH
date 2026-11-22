export interface IRegisterUsersPayload {
	name: string;
	email: string;
	password: string;
	kids: {
		contactNumber?: string;
	};
}


export interface IVerifyEmailPayload {
	email: string;
	otp: string;
}