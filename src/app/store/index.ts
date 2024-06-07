import { isDevMode, Type } from "@angular/core";
import { FunctionalEffect } from "@ngrx/effects";
import { routerReducer, RouterState } from "@ngrx/router-store";
import { ActionReducerMap, MetaReducer } from "@ngrx/store";

import { GroupEffects } from "./group/group.effect";
import { groupReducer, GroupState } from "./group/group.reducer";
import { UserEffects } from "./user/user.effect";
import { userReducer, UserState } from "./user/user.reducer";
import { AuthEffects } from "./auth/auth.effect";
import { AppEffects } from "./app.effect";

export interface State {
	user: UserState;
	group: GroupState;
	router: RouterState;
}

export const effects: (Type<unknown> | Record<string, FunctionalEffect>)[] = [
	AppEffects,
	AuthEffects,
	UserEffects,
	GroupEffects
];

export const reducers: ActionReducerMap<State> = {
	user: userReducer,
	group: groupReducer,
	router: routerReducer
};

export const metaReducers: MetaReducer<State>[] = isDevMode() ? [] : [];
