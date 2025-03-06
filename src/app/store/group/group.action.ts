import { createAction, props } from "@ngrx/store";

import { GroupInfo, MemberRole, UpsertGroup } from "../../models/group.model";

export namespace GroupAction {
	const ACTION_PREFIX = "[Group] -";

	export const query = createAction(`${ACTION_PREFIX} Query`, props<{ userId: string }>());
	export const added = createAction(`${ACTION_PREFIX} Added`, props<{ group: GroupInfo }>());
	export const modified = createAction(`${ACTION_PREFIX} Modified`, props<{ group: GroupInfo }>());
	export const removed = createAction(`${ACTION_PREFIX} Removed`, props<{ id: string }>());

	export const create = createAction(`${ACTION_PREFIX} Create`, props<{ upsertGroup: UpsertGroup }>());
	export const createSuccess = createAction(`${ACTION_PREFIX} Create Success`);

	export const update = createAction(
		`${ACTION_PREFIX} Update`,
		props<{ id: string; upsertGroup: UpsertGroup }>()
	);

	export const updateRole = createAction(
		`${ACTION_PREFIX} Update Role`,
		props<{ id: string; memberId: string; role: MemberRole }>()
	);

	export const updateSuccess = createAction(`${ACTION_PREFIX} Update Success`);

	export const deleteGroup = createAction(`${ACTION_PREFIX} Delete`, props<{ id: string }>());
	export const deleteSuccess = createAction(`${ACTION_PREFIX} Delete Success`);

	export const getCode = createAction(`${ACTION_PREFIX} Get Code`, props<{ id: string }>());
	export const getCodeSuccess = createAction(
		`${ACTION_PREFIX} Get Code Success`,
		props<{ id: string; code: number }>()
	);

	export const addMember = createAction(`${ACTION_PREFIX} Add Member`, props<{ code: number }>());
	export const addVirtualMember = createAction(
		`${ACTION_PREFIX} Add Virtual Member`, 
		props<{ groupId: string; name: string }>()
	);
	export const addMemberSuccess = createAction(`${ACTION_PREFIX} Add Member Success`);

	export const removeMember = createAction(
		`${ACTION_PREFIX} Remove Member`,
		props<{ id: string; memberId?: string }>()
	);
	export const removeMemberSuccess = createAction(
		`${ACTION_PREFIX} Remove Member Success`,
		props<{ memberId?: string }>()
	);

	export const addCategory = createAction(
		`${ACTION_PREFIX} Add Category`,
		props<{
			groupId: string;
			subCategoryName: string;
			icon: string;
			categoryId?: number;
			categoryName?: string;
		}>()
	);
	export const addCategorySuccess = createAction(`${ACTION_PREFIX} Add Category Success`);
}