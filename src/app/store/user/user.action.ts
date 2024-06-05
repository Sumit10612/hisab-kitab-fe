import { createAction, props } from "@ngrx/store";

import { User } from "../../models/user.model";

export namespace UserAction {
	const ACTION_PREFIX = "[User] -";

	export const get = createAction(`${ACTION_PREFIX} get`);
	export const getSuccess = createAction(`${ACTION_PREFIX} Get Success`, props<{ user: User }>());
	export const getFail = createAction(`${ACTION_PREFIX} Get Fail`);

	export const update = createAction(`${ACTION_PREFIX} Update`, props<{ user: User }>());
	export const updateSuccess = createAction(`${ACTION_PREFIX} Update Success`);
}