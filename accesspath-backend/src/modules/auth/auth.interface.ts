export interface IRegisterUsersPayload {
	name: string;
	email: string;
	password: string;
	kids: {
		contactNumber?: string;
	};
}
