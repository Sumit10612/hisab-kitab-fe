import { inject, Injectable } from "@angular/core";
import {
	collection,
	collectionData,
	docData,
	Firestore,
	orderBy,
	query
} from "@angular/fire/firestore";
import { doc, runTransaction } from "firebase/firestore";
import { map, Observable } from "rxjs";

import { Expense, ExpenseHelper, FirestoreExpense } from "../models/expense.model";
import { Group } from "../models/group.model";
import { getYearMonth } from "../utilities/date";

@Injectable({
	providedIn: "root"
})
export class ExpenseService {
	private firestore = inject(Firestore);

	get$ = (groupId: string, id: string): Observable<Expense> => {
		const ref = doc(this.firestore, "groups", groupId, "expenses", id);
		return (docData(ref) as Observable<FirestoreExpense>).pipe(
			map(expense => ExpenseHelper.toModel(expense))
		);
	};

	getAll$(groupId: string): Observable<Expense[]> {
		const ref = collection(this.firestore, "groups", groupId, "expenses");
		const q = query(ref, orderBy("expenseDate", "desc"));
		return (collectionData(q, { idField: "id" }) as Observable<FirestoreExpense[]>).pipe(
			map(expenses => expenses.map(expense => ExpenseHelper.toModel(expense)))
		);
	}
  
	add(groupId: string, expense: Expense): Promise<void> {
		const ref = doc(collection(this.firestore, "groups", groupId, "expenses"));
		const groupRef = doc(this.firestore, "groups", groupId);

		return runTransaction(this.firestore, async (transaction) => {
			const groupDoc = await transaction.get(groupRef);
			if(!groupDoc.exists()) {
				throw "Group does not exist!";
			}

			const group = groupDoc.data() as Group;

			// add new expense amount to group total
			const groupTotal = +(group.groupTotal ?? 0) + expense.amount;

			// add new expense to the corresponding month for which the expense is created
			const monthTotal = group.monthTotal ?? {};
			const monthKey = getYearMonth(expense.expenseDate);
			monthTotal[monthKey] = +(monthTotal[monthKey] ?? 0) + expense.amount;

			transaction.update(groupRef, { groupTotal, monthTotal });
			transaction.set(ref, ExpenseHelper.toFireStoreModel(expense));
		});
	}

	update(groupId: string, id: string, updateExpense: Expense): Promise<void> {
		const ref = doc(collection(this.firestore, "groups", groupId, "expenses"), id);
		const groupRef = doc(this.firestore, "groups", groupId);

		return runTransaction(this.firestore, async (transaction) => {
			const expenseDoc = await transaction.get(ref);
			const groupDoc = await transaction.get(groupRef);
			if(!groupDoc.exists()) {
				throw "Group does not exist!";
			}

			if(!expenseDoc.exists()) {
				throw "Expense does not exists";
			}

			const group = groupDoc.data() as Group;
			const expense = ExpenseHelper.toModel(expenseDoc.data() as FirestoreExpense);

			const oldKey = getYearMonth(expense.expenseDate);
			const newKey = getYearMonth(updateExpense.expenseDate);

			// update the group total & month total
			if(expense.amount !== updateExpense.amount || oldKey !== newKey) {
				const groupTotal = +group.groupTotal - +expense.amount + updateExpense.amount;

				const monthTotal = group.monthTotal ?? [];				
				monthTotal[oldKey] = monthTotal[oldKey] - expense.amount;				
				monthTotal[newKey] = +(monthTotal[newKey] ?? 0) + updateExpense.amount;

				transaction.update(groupRef, { groupTotal, monthTotal });
			}

			transaction.set(ref, ExpenseHelper.toFireStoreModel(updateExpense), { merge: true });
		});
	}

	delete(groupId: string, id: string): Promise<void> {
		const ref = doc(collection(this.firestore, "groups", groupId, "expenses"), id);
		const groupRef = doc(this.firestore, "groups", groupId);

		return runTransaction(this.firestore, async (transaction) => {
			const expenseDoc = await transaction.get(ref);
			const groupDoc = await transaction.get(groupRef);
			
			if(!groupDoc.exists()) {
				throw "Group does not exist!";
			}

			if(!expenseDoc.exists()) {
				throw "Expense does not exists";
			}

			const group = groupDoc.data() as Group;
			const expense = ExpenseHelper.toModel(expenseDoc.data() as FirestoreExpense);

			const key = getYearMonth(expense.expenseDate);

			const groupTotal = group.groupTotal - expense.amount;
			const monthTotal = group.monthTotal ?? [];
			monthTotal[key] = monthTotal[key] - expense.amount;

			transaction.update(groupRef, { groupTotal, monthTotal });
			transaction.delete(ref);
		});
	}
}
