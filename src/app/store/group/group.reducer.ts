import { createEntityAdapter, EntityState } from "@ngrx/entity";
import { createReducer, on } from "@ngrx/store";
import { keyBy } from "lodash-es";

import { Group } from "../../models/group.model";

import { GroupAction } from "./group.action";

export interface GroupState {
	groups: Record<string, Group>;
	groupCodes: EntityState<{ id: string; code: number }>;
}

export const groupCodeAdapter = createEntityAdapter<{ id: string; code: number }>({
	selectId: gc => gc.id,
	sortComparer: false
});

const INITIAL_STATE: GroupState = {
	groups: {},
	groupCodes: groupCodeAdapter.getInitialState(),
};

export const groupReducer = createReducer<GroupState>(
	INITIAL_STATE,
	on(GroupAction.getAllSuccess, (state, { groups }) => ({
		...state,
		groups: keyBy(groups, group => group.id)
	})),
	on(GroupAction.getCodeSuccess, (state, { id, code }) => ({
		...state,
		groupCodes: groupCodeAdapter.upsertOne({ id, code }, state.groupCodes)
	}))
);