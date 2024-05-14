import { Timestamp } from "firebase/firestore";

export interface ExpenseBase {
    description: string;
    amount: number;
    categories: number[];
    paidBy: string;
}

export interface Expense extends ExpenseBase {
    expenseDate: Date;
}

export interface FirestoreExpense extends ExpenseBase {
    expenseDate: Timestamp;
    timestamp: Timestamp;
}

export class ExpenseHelper {
    static toFireStoreModel(expense: Expense): FirestoreExpense {
        const base: ExpenseBase = expense;
        return {
            ...base,
            expenseDate: Timestamp.fromDate(expense.expenseDate),
            timestamp: Timestamp.fromDate(new Date)
        };
    }

    static toModel(expense: FirestoreExpense): Expense {
        const base = expense;
        return {
            ...base,
            expenseDate: expense.expenseDate.toDate()
        };
    }
}