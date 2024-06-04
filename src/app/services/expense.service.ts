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
import { doc, DocumentData, runTransaction, Transaction } from "firebase/firestore";
import { map, Observable, take } from "rxjs";

import { Expense, FirestoreExpense, fromFirestoreModel, toFirestoreModel } from "../models/expense.model";
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

	private readonly groupRef = (id: string) => doc(this.firestore, "groups", id);
	private readonly docRef = (groupId: string, id: string) => doc(this.groupRef(groupId), "expenses", id);
	private readonly collectionRef = (groupId: string) => collection(this.groupRef(groupId), "expenses");
	private readonly docCollectionRef = (groupId: string, id: string) => doc(this.collectionRef(groupId), id);

	get$ = (groupId: string, id: string): Observable<Expense> => {
		return (docData(this.docRef(groupId, id)) as Observable<FirestoreExpense>).pipe(
			take(1),
			map(expense => fromFirestoreModel(expense))
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
			const expense = fromFirestoreModel(doc.data() as FirestoreExpense);
			expense.id = doc.id;
			return expense;
		});
	}

	add(groupId: string, expense: Expense): Promise<void> {
		return runTransaction(this.firestore, async (transaction) => {
			const groupSnapshot = await transaction.get(this.groupRef(groupId));
			const groupDoc = throwIfNotFound(groupSnapshot).data() as Group;

			// add new expense amount to group total
			const groupTotal = +(groupDoc.groupTotal ?? 0) + expense.amount;

			// add new expense to the corresponding month for which the expense is created
			const monthTotal = groupDoc.monthTotal ?? {};
			const monthKey = getYearMonth(expense.expenseDate);
			monthTotal[monthKey] = +(monthTotal[monthKey] ?? 0) + expense.amount;

			transaction.update(this.groupRef(groupId), { groupTotal, monthTotal });
			transaction.set(doc(this.collectionRef(groupId)), toFirestoreModel(expense));
		});
	}

	update(groupId: string, id: string, updateExpense: Expense): Promise<void> {
		return runTransaction(this.firestore, async (transaction) => {
			const { groupDoc, expenseDoc } =  await this.getGroupExpense(transaction, groupId, id);

			const oldKey = getYearMonth(expenseDoc.expenseDate);
			const newKey = getYearMonth(updateExpense.expenseDate);

			// update the group total & month total
			if (expenseDoc.amount !== updateExpense.amount || oldKey !== newKey) {
				const groupTotal = +groupDoc.groupTotal - +expenseDoc.amount + updateExpense.amount;

				const monthTotal = groupDoc.monthTotal ?? [];
				monthTotal[oldKey] = monthTotal[oldKey] - expenseDoc.amount;
				monthTotal[newKey] = +(monthTotal[newKey] ?? 0) + updateExpense.amount;

				transaction.update(this.groupRef(groupId), { groupTotal, monthTotal });
			}

			transaction.set(this.docCollectionRef(groupId, id), toFirestoreModel(updateExpense), { merge: true });
		});
	}

	delete(groupId: string, id: string): Promise<void> {
		return runTransaction(this.firestore, async (transaction) => {
			const { groupDoc, expenseDoc } = await this.getGroupExpense(transaction, groupId, id);

			const key = getYearMonth(expenseDoc.expenseDate);

			const groupTotal = groupDoc.groupTotal - expenseDoc.amount;
			const monthTotal = groupDoc.monthTotal ?? [];
			monthTotal[key] = monthTotal[key] - expenseDoc.amount;

			transaction.update(this.groupRef(groupId), { groupTotal, monthTotal });
			transaction.delete(this.docCollectionRef(groupId, id));
		});
	}

	private async getGroupExpense(
		transaction: Transaction,
		groupId: string,
		expenseId: string
	): Promise<{ groupDoc: Group; expenseDoc: Expense; }> {
		const groupSnapshot = await transaction.get(this.groupRef(groupId));
		const groupDoc = throwIfNotFound(groupSnapshot).data() as Group;

		const expenseSnapshot = await transaction.get(this.docCollectionRef(groupId, expenseId));
		const expenseDoc = throwIfNotFound(expenseSnapshot).data() as FirestoreExpense;

		return { groupDoc, expenseDoc: fromFirestoreModel(expenseDoc) };
	}
}
