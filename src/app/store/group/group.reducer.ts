import { createEntityAdapter, EntityState } from "@ngrx/entity";
import { createReducer, on } from "@ngrx/store";

import { Group } from "../../models/group.model";

import { GroupAction } from "./group.action";

export interface GroupEntityState extends EntityState<Group> {}

export interface GroupState {
	groups: EntityState<Group>;
}

export const groupAdapter = createEntityAdapter<Group>({
	selectId: group => group.id,
	sortComparer: false
});

const INITIAL_STATE: GroupState = {
	groups: groupAdapter.getInitialState()
};

export const groupReducer = createReducer<GroupState>(
	INITIAL_STATE,
	on(GroupAction.getAllSuccess, (state, { groups }) => ({
		...state,
		groups: groupAdapter.upsertMany(groups, state.groups)
	})),
	on(GroupAction.createSuccess, (state, { group }) => ({
		...state,
		groups: groupAdapter.addOne(group, state.groups)
	})),
	on(GroupAction.deleteSuccess, (state, { id }) => ({
		...state,
		groups: groupAdapter.removeOne(id, state.groups)
	}))
);