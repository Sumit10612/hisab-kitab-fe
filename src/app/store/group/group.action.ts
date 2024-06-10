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

	export const getAll = createAction(`${ACTION_PREFIX} Get All`);
	export const getAllSuccess = createAction(
		`${ACTION_PREFIX} Get All Success`,
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

	export const updateRole = createAction(
		`${ACTION_PREFIX} Update Role`,
		props<{ id: string; memberId: string; role: "admin" | "user"; }>()
	);
	export const updateRoleSuccess = createAction(
		`${ACTION_PREFIX} Update Role Success`,
		props<{ id: string; }>()
	);
	export const updateRoleFail = createAction(`${ACTION_PREFIX} Update Role Fail`);

	export const reorderGroups = createAction(
		`${ACTION_PREFIX} Reorder`,
		props<{ reorderedGroups: GroupOrder[] }>()
	);
	export const reorderGroupsFail = createAction(`${ACTION_PREFIX} Reorder Fail`);

	export const deleteGroup = createAction(`${ACTION_PREFIX} Delete`, props<{ id: string }>());
	export const deleteSuccess = createAction(`${ACTION_PREFIX} Delete Success`, props<{ id: string }>());
	export const deleteFail = createAction(`${ACTION_PREFIX} Delete Fail`);

	export const getCode = createAction(`${ACTION_PREFIX} Get Code`, props<{ id: string }>());
	export const getCodeSuccess = createAction(
		`${ACTION_PREFIX} Get Code Success`,
		props<{ id: string; code: number; }>()
	);
	export const getCodeFail = createAction(`${ACTION_PREFIX} Get Code Fail`);

	export const addMember = createAction(`${ACTION_PREFIX} Add Member`, props<{ code: number }>());
	export const addMemberSuccess = createAction(
		`${ACTION_PREFIX} Add Member Success`,
		props<{ id: string }>()
	);
	export const addMemberFail = createAction(`${ACTION_PREFIX} Add Member Fail`);

	export const removeMember = createAction(
		`${ACTION_PREFIX} Remove Member`,
		props<{ id: string; memberId?: string }>()
	);
	export const removeMemberSuccess = createAction(
		`${ACTION_PREFIX} Remove Member Success`,
		props<{ id: string; memberId?: string; }>()
	);
	export const removeMemberFail = createAction(`${ACTION_PREFIX} Remove Member Fail`);
}