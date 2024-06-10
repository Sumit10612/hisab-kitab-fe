import { inject, Injectable } from "@angular/core";
import {
	collection,
	Firestore,
	getDocs,
	limit,
	orderBy,
	query,
	startAfter
} from "@angular/fire/firestore";
import { doc, DocumentData, runTransaction, Transaction } from "firebase/firestore";

import { Expense, FirestoreExpense, fromFirestoreModel, toFirestoreModel } from "../models/expense.model";
import { Group } from "../models/group.model";
import { getYearMonth } from "../utilities/date";
import { throwIfNotFound } from "../utilities/firebase-errors";
import { GROUP_COLLECTION_NAME } from "./group.service";

const COLLECTION_NAME = "expenses";

@Injectable({
	providedIn: "root"
})
export class ExpenseService {
	private firestore = inject(Firestore);

	private lastRetrievedDoc: DocumentData | null = null;
	private lastPageRetrieved = false;

	private readonly groupRef = (id: string) => doc(this.firestore, "groups", id);
	private readonly collectionRef = (groupId: string) => collection(doc(this.firestore, GROUP_COLLECTION_NAME, groupId), "expenses");
	private readonly docCollectionRef = (groupId: string, id: string) => doc(this.collectionRef(groupId), id);

	async getNext(groupId: string, initialGet = false): Promise<Expense[]> {
		if (initialGet) {
			this.lastRetrievedDoc = null;
			this.lastPageRetrieved = false;
		}

		if (this.lastPageRetrieved) {
			return [];
		}

		const ref = collection(this.firestore, GROUP_COLLECTION_NAME, groupId, COLLECTION_NAME);
		let queryRef = query(ref, orderBy("expenseDate", "desc"), limit(25));
		if (this.lastRetrievedDoc) {
			queryRef = query(
				this.collectionRef(groupId),
				orderBy("expenseDate", "desc"),
				startAfter(this.lastRetrievedDoc),
				limit(25)
			);
		}

		const documentSnapshots = await getDocs(queryRef);
		this.lastRetrievedDoc = documentSnapshots.docs[documentSnapshots.docs.length - 1];
		if (documentSnapshots.empty) {
			this.lastPageRetrieved = true;
		}

		return documentSnapshots.docs.map(doc => {
			const expense = fromFirestoreModel(doc.data() as FirestoreExpense);
			expense.id = doc.id;
			return expense;
		});
	}

	add(groupId: string, expense: Expense): Promise<void> {
		const groupRef = doc(this.firestore, GROUP_COLLECTION_NAME, groupId);
		const ref = doc(collection(groupRef, COLLECTION_NAME));

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
			transaction.set(ref, toFirestoreModel(expense));
		});
	}

	update(groupId: string, id: string, updateExpense: Expense): Promise<void> {
		const groupRef = doc(this.firestore, GROUP_COLLECTION_NAME, groupId);
		const ref = doc(collection(groupRef, COLLECTION_NAME), id);

		return runTransaction(this.firestore, async (transaction) => {
			const { groupDoc, expenseDoc } = await this.getGroupExpense(transaction, groupId, id);

			const oldKey = getYearMonth(expenseDoc.expenseDate);
			const newKey = getYearMonth(updateExpense.expenseDate);

			// update the group total & month total
			if (expenseDoc.amount !== updateExpense.amount || oldKey !== newKey) {
				const groupTotal = +groupDoc.groupTotal - +expenseDoc.amount + updateExpense.amount;

				const monthTotal = groupDoc.monthTotal ?? [];
				monthTotal[oldKey] = monthTotal[oldKey] - expenseDoc.amount;
				monthTotal[newKey] = +(monthTotal[newKey] ?? 0) + updateExpense.amount;

				transaction.update(groupRef, { groupTotal, monthTotal });
			}

			transaction.set(ref, toFirestoreModel(updateExpense), { merge: true });
		});
	}

	delete(groupId: string, id: string): Promise<void> {
		const groupRef = doc(this.firestore, GROUP_COLLECTION_NAME, groupId);
		const ref = doc(collection(groupRef, COLLECTION_NAME), id);

		return runTransaction(this.firestore, async (transaction) => {
			const { groupDoc, expenseDoc } = await this.getGroupExpense(transaction, groupId, id);

			const key = getYearMonth(expenseDoc.expenseDate);

			const groupTotal = groupDoc.groupTotal - expenseDoc.amount;
			const monthTotal = groupDoc.monthTotal ?? [];
			monthTotal[key] = monthTotal[key] - expenseDoc.amount;

			transaction.update(groupRef, { groupTotal, monthTotal });
			transaction.delete(ref);
		});
	}

	private async getGroupExpense(
		transaction: Transaction,
		groupId: string,
		expenseId: string
	): Promise<{ groupDoc: Group; expenseDoc: Expense }> {
		const groupRef = doc(this.firestore, GROUP_COLLECTION_NAME, groupId);
		const ref = doc(collection(groupRef, COLLECTION_NAME), expenseId);

		const groupSnapshot = await transaction.get(groupRef);
		const groupDoc = throwIfNotFound(groupSnapshot).data() as Group;

		const expenseSnapshot = await transaction.get(ref);
		const expenseDoc = throwIfNotFound(expenseSnapshot).data() as FirestoreExpense;

		return { groupDoc, expenseDoc: fromFirestoreModel(expenseDoc) };
	}
}
