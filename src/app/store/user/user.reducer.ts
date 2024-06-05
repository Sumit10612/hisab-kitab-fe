import { createReducer, on } from "@ngrx/store";

import { User } from "../../models/user.model";

import { UserAction } from "./user.action";

export interface UserState {
	user?: User;
}

export const INITIAL_STATE: UserState = {
	user: undefined
};

export const userReducer = createReducer<UserState>(
	INITIAL_STATE,
	on(UserAction.getSuccess, (state, { user }): UserState => ({
		...state,
		user
	}))
);