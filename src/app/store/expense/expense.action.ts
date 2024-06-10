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
	export const getNextFail = createAction(`${ACTION_PREFIX} Get Next Fail`);

	export const add = createAction(
		`${ACTION_PREFIX} Add`,
		props<{
			groupId: string,
			expense: Expense
		}>()
	);
	export const addFail = createAction(`${ACTION_PREFIX} Add Fail`);

	export const update = createAction(
		`${ACTION_PREFIX} Update`,
		props<{
			groupId: string,
			id: string,
			expense: Expense
		}>()
	);
	export const updateFail = createAction(`${ACTION_PREFIX} Update Fail`);

	export const remove = createAction(
		`${ACTION_PREFIX} Delete`,
		props<{
			groupId: string,
			id: string
		}>()
	);
	export const removeFail = createAction(`${ACTION_PREFIX} Remove Fail`);
	
	export const cudSuccess = createAction(`${ACTION_PREFIX} Add/Update/Delete Success`);
}