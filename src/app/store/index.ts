import { isDevMode, Type } from "@angular/core";
import { FunctionalEffect } from "@ngrx/effects";
import { ActionReducerMap, MetaReducer } from "@ngrx/store";

import { GroupEffects } from "./group/group.effect";
import { groupReducer, GroupState } from "./group/group.reducer";
import { UserEffects } from "./user/user.effect";
import { userReducer, UserState } from "./user/user.reducer";

export interface State {
	user: UserState;
	group: GroupState;
}

export const effects: (Type<unknown> | Record<string, FunctionalEffect>)[] = [
	UserEffects,
	GroupEffects
];

export const reducers: ActionReducerMap<State> = {
	user: userReducer,
	group: groupReducer
};

export const metaReducers: MetaReducer<State>[] = isDevMode() ? [] : [];
