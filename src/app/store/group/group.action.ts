import { createAction, props } from "@ngrx/store";

import { Group } from "../../models/group.model";
import { GroupOrder } from "../../models/user.model";

export namespace GroupAction {
	const ACTION_PREFIX = "[Group] -";

	export const getAll = createAction(
		`${ACTION_PREFIX} Get All User's Group`,
		props<{
			ids: string[];
			groups: GroupOrder[];
		}>()
	);

	export const getAllSuccess = createAction(
		`${ACTION_PREFIX} Get All User's Group Success`,
		props<{ groups: Group[] }>()
	);
}