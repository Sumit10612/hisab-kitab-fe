import { Timestamp } from "firebase/firestore";

export interface ExpenseBase {
	id?: string;
    description: string;
	where?: string;
    amount: number;
    category?: number;
    paidBy: string;
	usersShare: Record<string, number>;
}

export interface Expense extends ExpenseBase {
	expenseDate: Date;
}

export interface FirestoreExpense extends ExpenseBase {
	expenseDate: Timestamp;
	timestamp: Timestamp;
}

export const toFirestoreModel = (expense: Expense): FirestoreExpense => {
	const base: ExpenseBase = expense;
	return {
		...base,
		expenseDate: Timestamp.fromDate(expense.expenseDate),
		timestamp: Timestamp.now()
	};
};

export const fromFirestoreModel = (expense: FirestoreExpense): Expense => {
	const base = expense;
	return {
		...base,
		expenseDate: expense.expenseDate.toDate()
	};
};