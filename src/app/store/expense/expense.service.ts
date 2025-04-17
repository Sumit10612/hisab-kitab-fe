import { inject, Injectable } from "@angular/core";
import {
	collection,
	Firestore,
	getDocs,
	limit,
	orderBy,
	query,
	startAfter,
	where
} from "@angular/fire/firestore";
import {
	doc,
	DocumentData,
	runTransaction,
	Timestamp,
	Transaction
} from "firebase/firestore";
import { keys } from "lodash-es";

import { Expense, FirestoreExpense, fromFirestoreModel, toFirestoreModel } from "../../models/expense.model";
import { Group } from "../../models/group.model";
import { DateUtilities } from "../../utilities/date";
import { throwIfNotFound } from "../../utilities/firebase-errors";

import { GROUP_COLLECTION_NAME } from "../group/group.service";

const COLLECTION_NAME = "expenses";

@Injectable({
	providedIn: "root"
})
export class ExpenseService {
	private readonly firestore = inject(Firestore);

	private lastRetrievedDoc: DocumentData | null = null;
	private lastPageRetrieved = false;

	async getNext(groupId: string, initialGet = false): Promise<Expense[]> {
		if (initialGet) {
			this.lastRetrievedDoc = null;
			this.lastPageRetrieved = false;
		}

		if (this.lastPageRetrieved) {
			return [];
		}

		const queryRef = query(
			collection(this.firestore, GROUP_COLLECTION_NAME, groupId, COLLECTION_NAME),
			orderBy("expenseDate", "desc"),
			orderBy("timestamp", "desc"),
			this.lastRetrievedDoc ? startAfter(this.lastRetrievedDoc) : limit(25),
			limit(25)
		);

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

	async getByDateRange(groupId: string, from: Date, to: Date): Promise<Expense[]> {
		const queryRef = query(
			collection(this.firestore, GROUP_COLLECTION_NAME, groupId, COLLECTION_NAME),
			where("expenseDate", ">=", Timestamp.fromDate(from)),
			where("expenseDate", "<=", Timestamp.fromDate(to))
		);

		const snapshot = await getDocs(queryRef);
		return snapshot.docs.map(doc => {
			const expense = fromFirestoreModel(doc.data() as FirestoreExpense);
			expense.id = doc.id;
			return expense;
		});
	}

	add(groupId: string, expense: Expense): Promise<string> {
		const groupRef = doc(this.firestore, GROUP_COLLECTION_NAME, groupId);
		const ref = doc(collection(groupRef, COLLECTION_NAME));

		return runTransaction(this.firestore, async (transaction) => {
			const groupSnapshot = await transaction.get(groupRef);
			const groupDoc = throwIfNotFound(groupSnapshot).data() as Group;

			// Calculate new group total
			const groupTotal = +(groupDoc.groupTotal ?? 0) + expense.amount;

			// Calculate new month total for the specific month of the expense
			const monthTotal = groupDoc.monthTotal ?? {};
			const monthKey = DateUtilities.yearMonth(expense.expenseDate);
			monthTotal[monthKey] = +(monthTotal[monthKey] ?? 0) + expense.amount;

			// Handle split expense type
			groupDoc.members[expense.paidBy].paid += expense.amount;
			keys(expense.usersShare).forEach(memberId => {
				groupDoc.members[memberId].share += expense.usersShare[memberId];
			});

			transaction.update(groupRef, {
				groupTotal,
				monthTotal,
				modifiedAt: Timestamp.fromDate(new Date()),
				members: groupDoc.members
			});
			transaction.set(ref, toFirestoreModel(expense));

			return ref.id;
		});
	}

	update(groupId: string, id: string, updateExpense: Expense): Promise<void> {
		const groupRef = doc(this.firestore, GROUP_COLLECTION_NAME, groupId);
		const ref = doc(collection(groupRef, COLLECTION_NAME), id);

		return runTransaction(this.firestore, async (transaction) => {
			const { groupDoc, expenseDoc } = await this.getGroupExpense(transaction, groupId, id);

			const oldKey = DateUtilities.yearMonth(expenseDoc.expenseDate);
			const newKey = DateUtilities.yearMonth(updateExpense.expenseDate);

			// update the group total & month total
			if (expenseDoc.amount !== updateExpense.amount || oldKey !== newKey) {
				const groupTotal = +groupDoc.groupTotal - +expenseDoc.amount + updateExpense.amount;

				const monthTotal = groupDoc.monthTotal ?? [];
				monthTotal[oldKey] = monthTotal[oldKey] - expenseDoc.amount;
				monthTotal[newKey] = +(monthTotal[newKey] ?? 0) + updateExpense.amount;

				// Handle split expense type
				// Update the paid amount for the user who paid
				groupDoc.members[expenseDoc.paidBy].paid -= expenseDoc.amount;
				groupDoc.members[updateExpense.paidBy].paid += updateExpense.amount;

				// Update the share for each user involved
				keys(expenseDoc.usersShare).forEach(memberId => {
					groupDoc.members[memberId].share -= expenseDoc.usersShare[memberId];
				});
				keys(updateExpense.usersShare).forEach(memberId => {
					groupDoc.members[memberId].share += updateExpense.usersShare[memberId];
				});

				transaction.update(groupRef, {
					groupTotal,
					monthTotal,
					members: groupDoc.members,
					modifiedAt: Timestamp.fromDate(new Date())
				});
			}

			transaction.set(ref, toFirestoreModel(updateExpense), { merge: true });
		});
	}

	delete(groupId: string, id: string): Promise<void> {
		const groupRef = doc(this.firestore, GROUP_COLLECTION_NAME, groupId);
		const ref = doc(collection(groupRef, COLLECTION_NAME), id);

		return runTransaction(this.firestore, async (transaction) => {
			const { groupDoc, expenseDoc } = await this.getGroupExpense(transaction, groupId, id);

			const key = DateUtilities.yearMonth(expenseDoc.expenseDate);

			const groupTotal = groupDoc.groupTotal - expenseDoc.amount;
			const monthTotal = groupDoc.monthTotal ?? [];
			monthTotal[key] = monthTotal[key] - expenseDoc.amount;

			// Handle split expense type
			// Update the paid amount for the user who paid
			groupDoc.members[expenseDoc.paidBy].paid -= expenseDoc.amount;

			// Update the share for each user involved
			keys(expenseDoc.usersShare).forEach(memberId => {
				groupDoc.members[memberId].share -= expenseDoc.usersShare[memberId];
			});

			transaction.update(groupRef, {
				groupTotal,
				monthTotal,
				members: groupDoc.members,
				modifiedAt: Timestamp.fromDate(new Date())
			});
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
