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
import { Observable } from "rxjs";

import { Expense } from "../models/expense.model";

@Injectable({
	providedIn: "root"
})
export class GroupExpenseService {
	private firestore = inject(Firestore);
  
	async addExpense(groupId: string, expense: Expense): Promise<void> {
		const ref = collection(this.firestore, "group_expenses", groupId, "expenses");
		await addDoc(ref, {
			...expense,
			timestamp: Timestamp.fromDate(new Date())
		} as Expense);
	}

	getGroupExpenses$(groupId: string): Observable<Expense[]> {
		const ref = collection(this.firestore, "group_expenses", groupId, "expenses");
		const q = query(ref, orderBy("expenseDate", "asc"));
		return collectionData(q) as Observable<Expense[]>;
	}
}
