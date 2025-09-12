import { createReducer, on } from "@ngrx/store";

import { User } from "../../models/user.model";

import { UserActions } from "./user.action";

export interface UserState {
    user: User | null;
}

export const INITIAL_STATE: UserState = {
    user: null,
};

export const userReducer = createReducer<UserState>(
    INITIAL_STATE,
    on(
        UserActions.getSuccess,
        (state, { user }): UserState => ({
            ...state,
            user,
        }),
    ),
    on(UserActions.updateSuccess, (state, { user }): UserState => {
        if (state.user) {
            return {
                ...state,
                user: {
                    ...state.user,
                    name: user.name,
                    photoUrl: user.photoUrl,
                    preferences: user.preferences,
                },
            };
        }
        return { ...state };
    }),
);
