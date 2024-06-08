import { createAction, props } from "@ngrx/store";

import { Group, UpsertGroup } from "../../models/group.model";
import { GroupOrder } from "../../models/user.model";

export namespace GroupAction {
	const ACTION_PREFIX = "[Group] -";

	export const create = createAction(
		`${ACTION_PREFIX} Create`,
		props<{ upsertGroup: UpsertGroup }>()
	);
	export const createSuccess = createAction(
		`${ACTION_PREFIX} Create Success`,
		props<{ group: Group }>()
	);
	export const createFail = createAction(`${ACTION_PREFIX} Create Fail`);

	export const getAll = createAction(`${ACTION_PREFIX} Get All User's Group`);
	export const getAllSuccess = createAction(
		`${ACTION_PREFIX} Get All User's Group Success`,
		props<{ groups: Group[] }>()
	);

	export const update = createAction(
		`${ACTION_PREFIX} Update`,
		props<{ id: string; upsertGroup: UpsertGroup; }>()
	);
	export const updateSuccess = createAction(
		`${ACTION_PREFIX} Update Success`,
		props<{ id: string; upsertGroup: UpsertGroup; }>()
	);
	export const updateFail = createAction(`${ACTION_PREFIX} Update Fail`);

	export const reorderGroups = createAction(
		`${ACTION_PREFIX} Reorder`,
		props<{ reorderedGroups: GroupOrder[] }>()
	);
	export const reorderGroupsFail = createAction(`${ACTION_PREFIX} Reorder Fail`);

	export const deleteGroup = createAction(`${ACTION_PREFIX} Delete`, props<{ id: string }>());
	export const deleteSuccess = createAction(`${ACTION_PREFIX} Delete Success`, props<{ id: string }>());
	export const deleteFail = createAction(`${ACTION_PREFIX} Delete Fail`);
}