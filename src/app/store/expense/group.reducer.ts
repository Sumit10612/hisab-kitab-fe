import { createEntityAdapter, EntityState } from "@ngrx/entity";
import { createReducer, on } from "@ngrx/store";

import { Expense } from "../../models/expense.model";

import { ExpenseAction } from "./expense.action";

export interface ExpenseState {
	loading: boolean;
	expenses: EntityState<Expense>;
}

export const expenseAdapter = createEntityAdapter<Expense>({
	selectId: expense => expense.id,
	sortComparer: false
});

const INITIAL_STATE: ExpenseState = {
	loading: false,
	expenses: expenseAdapter.getInitialState()
};

export const expenseReducer = createReducer<ExpenseState>(
	INITIAL_STATE,
	on(ExpenseAction.getNext, (state, { initialGet }): ExpenseState => {
		if (initialGet) {
			return ({ ...state, expenses: expenseAdapter.removeAll(state.expenses), loading: true });
		} else {
			return ({ ...state, loading: true });
		}
	}),
	on(ExpenseAction.getNextSuccess, (state, { expenses }): ExpenseState => ({
		...state,
		expenses: expenseAdapter.upsertMany(expenses, state.expenses),
		loading: false
	}))
);