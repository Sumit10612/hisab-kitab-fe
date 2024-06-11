import { createSelector, MemoizedSelector, Selector } from "@ngrx/store";
import { values } from "lodash-es";

import { State } from "..";
import { Group } from "../../models/group.model";

import { groupCodeAdapter } from "./group.reducer";

export const groupCodeAdapterSelectors = groupCodeAdapter.getSelectors<State>(state => state.group.groupCodes);

export namespace GroupSelector {
	export const selectAll: Selector<State, Group[]> = state => values(state.group.groups);

	export const select = (id: string): Selector<State, Group> =>
		state => state.group.groups[id];

	export const selectCode: (id: string) => MemoizedSelector<State, number | undefined> =
		id => createSelector(
			groupCodeAdapterSelectors.selectEntities,
			entities => entities[id]?.code
		);
}