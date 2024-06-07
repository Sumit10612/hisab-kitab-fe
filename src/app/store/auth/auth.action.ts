import firebase from "@angular/fire/auth/firebase";
import { createAction, props } from "@ngrx/store";
import { User } from "../../models/user.model";

export namespace AuthActions {
	const ACTION_PREFIX = "[Auth]";

	export const login = createAction(
		`${ACTION_PREFIX} Login`,
		props<{ email: string; password: string }>()
	);
	export const loginSuccess = createAction(`${ACTION_PREFIX} Login Success`);

	export const loginFailure = createAction(
		`${ACTION_PREFIX} Login Fail`,
		props<{ error: any }>()
	);

	export const loginWithGoogle = createAction(`${ACTION_PREFIX} Login With Google`);

	export const loginWithGoogleSuccess = createAction(
		`${ACTION_PREFIX} Login With Google Success`,
		props<{ user: firebase.User | null }>()
	);

	export const loginWithGoogleFailure = createAction(
		`${ACTION_PREFIX} Login With Google Failure`,
		props<{ error: any }>()
	);

	export const logout = createAction(`${ACTION_PREFIX} Logout`);

	export const logoutSuccess = createAction(`${ACTION_PREFIX} Logout Success`);

	export const logoutFailure = createAction(
		`${ACTION_PREFIX} Logout Failure`,
		props<{ error: any }>()
	);

	export const signup = createAction(
		`${ACTION_PREFIX} Signup`,
		props<{
			email: string;
			password: string;
			name: string;
		}>()
	);

	export const signupSuccess = createAction(
		`${ACTION_PREFIX} Signup Success`,
		props<{ user: firebase.User }>()
	);

	export const signupFailure = createAction(
		`${ACTION_PREFIX} Signup Failure`,
		props<{ error: any }>()
	);

	export const saveUserProfile = createAction(
		`${ACTION_PREFIX} Save User Profile`,
		props<{ user: User }>()
	);

	export const saveUserProfileSuccess = createAction(`${ACTION_PREFIX} Save User Profile Success`);

	export const saveUserProfileFailure = createAction(
		`${ACTION_PREFIX} Save User Profile Failure`,
		props<{ error: any }>()
	);

	export const resetPassword = createAction(`${ACTION_PREFIX} Password Reset`, props<{ email: string }>());
	export const resetPasswordSuccess = createAction(`${ACTION_PREFIX} Password Reset Success`);
}