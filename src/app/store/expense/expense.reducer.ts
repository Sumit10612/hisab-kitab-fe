import { createEntityAdapter, EntityState } from "@ngrx/entity";
import { createReducer, on } from "@ngrx/store";

import { Expense } from "../../models/expense.model";

import { ExpenseAction } from "./expense.action";

export interface ExpenseState {
    loading: boolean;
    expenses: EntityState<Expense>;
}

export const expenseAdapter = createEntityAdapter<Expense>({
    selectId: (expense) => expense.id,
    sortComparer: (e1, e2) =>
        e1.expenseDate > e2.expenseDate
            ? -1
            : e1.expenseDate < e2.expenseDate
              ? 1
              : 0,
});

const INITIAL_STATE: ExpenseState = {
    loading: false,
    expenses: expenseAdapter.getInitialState(),
};

export const expenseReducer = createReducer<ExpenseState>(
    INITIAL_STATE,
    on(
        ExpenseAction.getNext,
        (state): ExpenseState => ({
            ...state,
            loading: true,
        }),
    ),
    on(
        ExpenseAction.getNextSuccess,
        (state, { expenses }): ExpenseState => ({
            ...state,
            expenses: expenseAdapter.upsertMany(expenses, state.expenses),
            loading: false,
        }),
    ),
    on(ExpenseAction.addSuccess, (state, { expense }) => ({
        ...state,
        expenses: expenseAdapter.addOne(expense, state.expenses),
    })),
    on(ExpenseAction.updateSuccess, (state, { expense }) => ({
        ...state,
        expenses: expenseAdapter.updateOne(
            { id: expense.id, changes: expense },
            state.expenses,
        ),
    })),
    on(ExpenseAction.removeSuccess, (state, { id }) => ({
        ...state,
        expenses: expenseAdapter.removeOne(id, state.expenses),
    })),
    on(ExpenseAction.reset, (state) => ({
        ...state,
        expenses: expenseAdapter.getInitialState(),
    })),
);
