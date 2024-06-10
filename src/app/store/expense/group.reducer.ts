import { createReducer, on } from "@ngrx/store";
import { Expense } from "../../models/expense.model";
import { ExpenseAction } from "./expense.action";
import { EntityState, createEntityAdapter } from "@ngrx/entity";

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
}

export const expenseReducer = createReducer(
	INITIAL_STATE,
	on(ExpenseAction.getNext, (state, { initialGet }) => {
		if(initialGet) {
			return ({ ...state, expenses: expenseAdapter.removeAll(state.expenses), loading: true })
		} else {
			return ({ ...state, loading: true })
		}
	}),
	on(ExpenseAction.getNextSuccess, (state, { expenses }) => ({
		...state,
		expenses: expenseAdapter.upsertMany(expenses, state.expenses),
		loading: false
	})),
	on(ExpenseAction.getNextFail, (state) => ({
		...state,
		loading: false
	})),
);