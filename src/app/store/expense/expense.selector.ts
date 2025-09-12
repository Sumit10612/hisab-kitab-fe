import { createSelector, MemoizedSelector, Selector } from "@ngrx/store";

import { State } from "..";
import { Expense } from "../../models/expense.model";

import { expenseAdapter } from "./expense.reducer";

const expenseAdapterSelector = expenseAdapter.getSelectors<State>(
    (state) => state.expense.expenses,
);

export namespace ExpenseSelector {
    export const selectAllExpenses: MemoizedSelector<State, Expense[]> =
        createSelector(
            expenseAdapterSelector.selectAll,
            (expenses) => expenses,
        );

    export const selectExpense: (
        id: string,
    ) => MemoizedSelector<State, Expense | undefined> = (id) =>
        createSelector(
            expenseAdapterSelector.selectEntities,
            (expenses) => expenses[id],
        );

    export const isLoading: Selector<State, boolean> = (state) =>
        state.expense.loading;
}
