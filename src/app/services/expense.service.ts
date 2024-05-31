import { inject, Injectable } from "@angular/core";
import {
	collection,
	docData,
	Firestore,
	getDocs,
	limit,
	orderBy,
	query,
	startAfter
} from "@angular/fire/firestore";
import { doc, DocumentData, runTransaction } from "firebase/firestore";
import { map, Observable, take } from "rxjs";

import { Expense, ExpenseHelper, FirestoreExpense } from "../models/expense.model";
import { Group } from "../models/group.model";
import { getYearMonth } from "../utilities/date";
import { throwIfNotFound } from "../utilities/firebase-errors";

@Injectable({
	providedIn: "root"
})
export class ExpenseService {
	private firestore = inject(Firestore);

	private lastRetrievedDoc: DocumentData | null = null;
	private lastPageRetrieved = false;

	private readonly docRef = (groupId: string, id: string) => doc(this.firestore, "groups", groupId, "expenses", id);
	private readonly collectionRef = (groupId: string) => collection(this.firestore, "groups", groupId, "expenses");

	get$ = (groupId: string, id: string): Observable<Expense> => {
		return (docData(this.docRef(groupId, id)) as Observable<FirestoreExpense>).pipe(
			take(1),
			map(expense => ExpenseHelper.toModel(expense))
		);
	};

	async getAll(groupId: string, initialGet = false): Promise<Expense[]> {
		if(initialGet) {
			this.lastRetrievedDoc = null;
			this.lastPageRetrieved = false;
		}

		if(this.lastPageRetrieved) {
			return [];
		}

		let queryRef = query(this.collectionRef(groupId), orderBy("expenseDate", "desc"), limit(25));
		if(this.lastRetrievedDoc) {
			queryRef = query(
				this.collectionRef(groupId),
				orderBy("expenseDate", "desc"),
				startAfter(this.lastRetrievedDoc),
				limit(25)
			);
		}

		const documentSnapshots = await getDocs(queryRef);
		this.lastRetrievedDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
		if(documentSnapshots.empty) {
			this.lastPageRetrieved = true;
		}

		return documentSnapshots.docs.map(doc => {
			const expense = ExpenseHelper.toModel(doc.data() as FirestoreExpense);
			expense.id = doc.id;
			return expense;
		});
	}

	add(groupId: string, expense: Expense): Promise<void> {
		const ref = doc(this.collectionRef(groupId));
		const groupRef = doc(this.firestore, "groups", groupId);

		return runTransaction(this.firestore, async (transaction) => {
			const groupSnapshot = await transaction.get(groupRef);
			const groupDoc = throwIfNotFound(groupSnapshot).data() as Group;

			// add new expense amount to group total
			const groupTotal = +(groupDoc.groupTotal ?? 0) + expense.amount;

			// add new expense to the corresponding month for which the expense is created
			const monthTotal = groupDoc.monthTotal ?? {};
			const monthKey = getYearMonth(expense.expenseDate);
			monthTotal[monthKey] = +(monthTotal[monthKey] ?? 0) + expense.amount;

			transaction.update(groupRef, { groupTotal, monthTotal });
			transaction.set(ref, ExpenseHelper.toFireStoreModel(expense));
		});
	}

	update(groupId: string, id: string, updateExpense: Expense): Promise<void> {
		const ref = doc(this.collectionRef(groupId), id);
		const groupRef = doc(this.firestore, "groups", groupId);

		return runTransaction(this.firestore, async (transaction) => {
			const expenseSnapshot = await transaction.get(ref);
			const expenseDoc = throwIfNotFound(expenseSnapshot).data() as FirestoreExpense;

			const groupSnapshot = await transaction.get(groupRef);
			const groupDoc = throwIfNotFound(groupSnapshot).data() as Group;

			const expense = ExpenseHelper.toModel(expenseDoc);

			const oldKey = getYearMonth(expense.expenseDate);
			const newKey = getYearMonth(updateExpense.expenseDate);

			// update the group total & month total
			if (expense.amount !== updateExpense.amount || oldKey !== newKey) {
				const groupTotal = +groupDoc.groupTotal - +expense.amount + updateExpense.amount;

				const monthTotal = groupDoc.monthTotal ?? [];
				monthTotal[oldKey] = monthTotal[oldKey] - expense.amount;
				monthTotal[newKey] = +(monthTotal[newKey] ?? 0) + updateExpense.amount;

				transaction.update(groupRef, { groupTotal, monthTotal });
			}

			transaction.set(ref, ExpenseHelper.toFireStoreModel(updateExpense), { merge: true });
		});
	}

	delete(groupId: string, id: string): Promise<void> {
		const ref = doc(this.collectionRef(groupId), id);
		const groupRef = doc(this.firestore, "groups", groupId);

		return runTransaction(this.firestore, async (transaction) => {
			const expenseSnapshot = await transaction.get(ref);
			const expenseDoc = throwIfNotFound(expenseSnapshot).data() as FirestoreExpense;

			const groupSnapshot = await transaction.get(groupRef);
			const groupDoc = throwIfNotFound(groupSnapshot).data() as Group;

			const expense = ExpenseHelper.toModel(expenseDoc);

			const key = getYearMonth(expense.expenseDate);

			const groupTotal = groupDoc.groupTotal - expense.amount;
			const monthTotal = groupDoc.monthTotal ?? [];
			monthTotal[key] = monthTotal[key] - expense.amount;

			transaction.update(groupRef, { groupTotal, monthTotal });
			transaction.delete(ref);
		});
	}
}
