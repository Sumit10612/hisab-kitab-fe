import { isDevMode, Type } from "@angular/core";
import { FunctionalEffect } from "@ngrx/effects";
import { ActionReducerMap, MetaReducer } from "@ngrx/store";

import { UserEffects } from "./user/user.effect";
import { userReducer, UserState } from "./user/user.reducer";

export interface State {
	user: UserState;
}

export const effects: (Type<unknown> | Record<string, FunctionalEffect>)[] = [
	UserEffects
];

export const reducers: ActionReducerMap<State> = {
	user: userReducer,
};

export const metaReducers: MetaReducer<State>[] = isDevMode() ? [] : [];
