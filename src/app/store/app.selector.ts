import { RouterReducerState } from "@ngrx/router-store";
import { createFeatureSelector, createSelector } from "@ngrx/store";

import { AppRouterState } from "./app.serializer";

export namespace RouterSelector {
	const selectRouter = createFeatureSelector<RouterReducerState<AppRouterState>>("router");

	export const selectParams = createSelector(selectRouter, state => state.state.params);
}