import { inject, Injectable } from "@angular/core";
import {
	addDoc,
	collection,
	collectionData,
	Firestore,
	getDoc,
	orderBy,
	query
} from "@angular/fire/firestore";
import { map, Observable } from "rxjs";

import { Expense, ExpenseHelper, FirestoreExpense } from "../models/expense.model";
import { doc, runTransaction } from "firebase/firestore";

@Injectable({
	providedIn: "root"
})
export class GroupExpenseService {
	private firestore = inject(Firestore);
  
	async addExpense(groupId: string, expense: Expense): Promise<void> {
		const ref = collection(this.firestore, "group_expenses", groupId, "expenses");
		const groupRef = doc(this.firestore, "groups", groupId);

		runTransaction(this.firestore, async (transaction) => {
			const groupDoc = await transaction.get(groupRef);
			if(!groupDoc.exists()) {
				throw "Group does not exist!";
			}
			const groupTotal = groupDoc.data()['groupTotalAmount'] ?? 0 + expense.amount;
			transaction.update(groupRef, { groupTotalAmount: groupTotal });
		})

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
