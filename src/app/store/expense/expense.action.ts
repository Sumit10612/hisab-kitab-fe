import { createAction, props } from "@ngrx/store";

import { Expense } from "../../models/expense.model";

export namespace ExpenseAction {
	const ACTION_PREFIX = "[Expense] -";

	export const getNext = createAction(
		`${ACTION_PREFIX} Get Next`,
		props<{
			groupId: string;
			initialGet: boolean;
		}>()
	);
	export const getNextSuccess = createAction(
		`${ACTION_PREFIX} Get Next Success`,
		props<{ expenses: Expense[] }>()
	);

	export const add = createAction(
		`${ACTION_PREFIX} Add`,
		props<{
			groupId: string;
			expense: Expense;
		}>()
	);
	export const addSuccess = createAction(`${ACTION_PREFIX} Add Success`);

	export const update = createAction(
		`${ACTION_PREFIX} Update`,
		props<{
			groupId: string;
			id: string;
			expense: Expense;
		}>()
	);
	export const updateSuccess = createAction(`${ACTION_PREFIX} Update Success`);

	export const remove = createAction(
		`${ACTION_PREFIX} Delete`,
		props<{
			groupId: string;
			id: string;
		}>()
	);
	export const removeSuccess = createAction(`${ACTION_PREFIX} Delete Success`);
}