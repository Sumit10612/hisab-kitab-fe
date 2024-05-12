import { Category } from "./category.model";

export interface Expense {
    description: string;
    amount: number;
    categories: Category[];
    paidBy: string;
    expenseDate: Date;
    timestamp: Date;
}