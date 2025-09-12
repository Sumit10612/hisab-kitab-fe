import { isDevMode, Type } from "@angular/core";
import { FunctionalEffect } from "@ngrx/effects";
import { routerReducer, RouterState } from "@ngrx/router-store";
import { ActionReducerMap, MetaReducer } from "@ngrx/store";

import { AppEffects } from "./app.effect";
import { AuthEffects } from "./auth/auth.effect";
import { ExpenseEffects } from "./expense/expense.effect";
import { expenseReducer, ExpenseState } from "./expense/expense.reducer";
import { GroupEffects } from "./group/group.effect";
import { groupReducer, GroupState } from "./group/group.reducer";
import { UserEffects } from "./user/user.effect";
import { userReducer, UserState } from "./user/user.reducer";

export interface State {
    user: UserState;
    group: GroupState;
    router: RouterState;
    expense: ExpenseState;
}

export const effects: (Type<unknown> | Record<string, FunctionalEffect>)[] = [
    AppEffects,
    AuthEffects,
    UserEffects,
    GroupEffects,
    ExpenseEffects,
];

export const reducers: ActionReducerMap<State> = {
    user: userReducer,
    group: groupReducer,
    router: routerReducer,
    expense: expenseReducer,
};

export const metaReducers: MetaReducer<State>[] = isDevMode() ? [] : [];
