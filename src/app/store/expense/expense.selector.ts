import { createSelector, MemoizedSelector, Selector } from "@ngrx/store";

import { State } from "..";
import { Expense } from "../../models/expense.model";

import { expenseAdapter } from "./group.reducer";

const expenseAdapterSelector = expenseAdapter.getSelectors<State>(state => state.expense.expenses);

export namespace ExpenseSelector {
	export const selectAll: () => MemoizedSelector<State, Expense[]> = () =>
		createSelector(
			expenseAdapterSelector.selectAll,
			(expenses) => expenses
		);
	export const select: (id: string) => MemoizedSelector<State, Expense | undefined> =
		(id) => createSelector(
			expenseAdapterSelector.selectEntities,
			(entities) => entities[id]
		);
	export const isLoading: Selector<State, boolean> = state => state.expense.loading;
}