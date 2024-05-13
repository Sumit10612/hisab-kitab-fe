import { Timestamp } from "firebase/firestore";

export interface Expense {
    description: string;
    amount: number;
    categories: number[];
    paidBy: string;
    expenseDate: Date;
    timestamp?: Timestamp;
}