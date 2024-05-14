import { inject, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
	addDoc,
	collection,
	collectionData,
	Firestore,
	orderBy,
	query,
	Timestamp
} from "@angular/fire/firestore";
import { map, Observable } from "rxjs";

import { Expense, ExpenseHelper, FirestoreExpense } from "../models/expense.model";

@Injectable({
	providedIn: "root"
})
export class GroupExpenseService {
	private firestore = inject(Firestore);
  
	async addExpense(groupId: string, expense: Expense): Promise<void> {
		const ref = collection(this.firestore, "group_expenses", groupId, "expenses");
		await addDoc(ref, ExpenseHelper.toFireStoreModel(expense));
	}

	getGroupExpenses$(groupId: string): Observable<Expense[]> {
		const ref = collection(this.firestore, "group_expenses", groupId, "expenses");
		const q = query(ref, orderBy("expenseDate", "asc"));
		return (collectionData(q) as Observable<FirestoreExpense[]>).pipe(
			map(expenses => expenses.map(expense => ExpenseHelper.toModel(expense)))
		);
	}
}
