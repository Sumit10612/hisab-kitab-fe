import { createSelector, MemoizedSelector } from "@ngrx/store";

import { State } from "..";
import { Group } from "../../models/group.model";

import { groupAdapter } from "./group.reducer";

export const groupAdapterSelectors = groupAdapter.getSelectors<State>(state => state.group.groups);

export namespace GroupSelector {
	export const selectGroups = () => groupAdapterSelectors.selectAll;

	export const selectGroup: (id: string) => MemoizedSelector<State, Group | undefined> =
		id => createSelector(
			groupAdapterSelectors.selectEntities,
			entities => entities[id]
		);
}