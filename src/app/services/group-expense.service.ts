import { inject, Injectable } from "@angular/core";
import {
	collection,
	collectionData,
	deleteDoc,
	docData,
	Firestore,
	orderBy,
	query
} from "@angular/fire/firestore";
import { doc, runTransaction } from "firebase/firestore";
import { map, Observable } from "rxjs";

import { Expense, ExpenseHelper, FirestoreExpense } from "../models/expense.model";

@Injectable({
	providedIn: "root"
})
export class GroupExpenseService {
	private firestore = inject(Firestore);

	getExpense$ = (groupId: string, id: string): Observable<Expense> => {
		const ref = doc(this.firestore, "group_expenses", groupId, "expenses", id);
		return (docData(ref) as Observable<FirestoreExpense>).pipe(
			map(expense => ExpenseHelper.toModel(expense))
		);
	};

	getGroupExpenses$(groupId: string): Observable<Expense[]> {
		const ref = collection(this.firestore, "group_expenses", groupId, "expenses");
		const q = query(ref, orderBy("expenseDate", "desc"));
		return (collectionData(q, { idField: "uid" }) as Observable<FirestoreExpense[]>).pipe(
			map(expenses => expenses.map(expense => ExpenseHelper.toModel(expense)))
		);
	}
  
	addExpense(groupId: string, expense: Expense): Promise<void> {
		const ref = doc(collection(this.firestore, "group_expenses", groupId, "expenses"));
		const groupRef = doc(this.firestore, "groups", groupId);
		return runTransaction(this.firestore, async (transaction) => {
			const groupDoc = await transaction.get(groupRef);
			if(!groupDoc.exists()) {
				throw "Group does not exist!";
			}
			const groupTotal = +(groupDoc.data()["groupTotalAmount"] ?? 0) + expense.amount;
			transaction.update(groupRef, { groupTotalAmount: groupTotal });
			transaction.set(ref, ExpenseHelper.toFireStoreModel(expense));
		});
	}

	updateExpense(groupId: string, id: string, expense: Expense): Promise<void> {
		const ref = doc(collection(this.firestore, "group_expenses", groupId, "expenses"), id);
		const groupRef = doc(this.firestore, "groups", groupId);
		return runTransaction(this.firestore, async (transaction) => {
			const expenseDoc = await transaction.get(ref);
			const groupDoc = await transaction.get(groupRef);
			if(!groupDoc.exists() || !expenseDoc.exists()) {
				throw "Group or expense does not exist!";
			}
			const groupTotal = +groupDoc.data()["groupTotalAmount"] - +expenseDoc.data()["amount"] + expense.amount;
			transaction.update(groupRef, { groupTotalAmount: groupTotal });
			transaction.set(ref, ExpenseHelper.toFireStoreModel(expense), { merge: true });
		});
	}

	deleteExpense(groupId: string, id: string): Promise<void> {
		const ref = doc(collection(this.firestore, "group_expenses", groupId, "expenses"), id);
		const groupRef = doc(this.firestore, "groups", groupId);
		return runTransaction(this.firestore, async (transaction) => {
			const expenseDoc = await transaction.get(ref);
			const groupDoc = await transaction.get(groupRef);
			if(!groupDoc.exists() || !expenseDoc.exists()) {
				throw "Group or expense does not exist!";
			}
			const groupTotal = +groupDoc.data()["groupTotalAmount"] - +expenseDoc.data()["amount"];
			transaction.update(groupRef, { groupTotalAmount: groupTotal });
			transaction.delete(ref);
		});
	}
}
