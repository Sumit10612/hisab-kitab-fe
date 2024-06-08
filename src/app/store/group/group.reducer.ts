import { createEntityAdapter, EntityState } from "@ngrx/entity";
import { createReducer, on } from "@ngrx/store";

import { Group } from "../../models/group.model";

import { GroupAction } from "./group.action";

export interface GroupState {
	groups: EntityState<Group>;
	groupCodes: EntityState<{ id: string, code: number }>;
}

export const groupAdapter = createEntityAdapter<Group>({
	selectId: group => group.id,
	sortComparer: false
});

export const groupCodeAdapter = createEntityAdapter<{ id: string, code: number }>({
	selectId: gc => gc.id,
	sortComparer: false
})

const INITIAL_STATE: GroupState = {
	groups: groupAdapter.getInitialState(),
	groupCodes: groupCodeAdapter.getInitialState(),
};

export const groupReducer = createReducer<GroupState>(
	INITIAL_STATE,
	on(GroupAction.getAllSuccess, (state, { groups }) => ({
		...state,
		groups: groupAdapter.upsertMany(groups, state.groups)
	})),
	on(GroupAction.getSuccess, (state, { group }) => ({
		...state,
		groups: groupAdapter.upsertOne(group, state.groups)
	})),
	on(GroupAction.createSuccess, (state, { group }) => ({
		...state,
		groups: groupAdapter.addOne(group, state.groups)
	})),
	on(GroupAction.deleteSuccess, (state, { id }) => ({
		...state,
		groups: groupAdapter.removeOne(id, state.groups)
	})),
	on(GroupAction.getCodeSuccess, (state, { id, code }) => ({
		...state,
		groupCodes: groupCodeAdapter.upsertOne({ id, code }, state.groupCodes)
	}))
);