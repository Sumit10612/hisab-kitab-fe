import { inject, Injectable } from "@angular/core";
import {
	addDoc,
	collection,
	collectionData,
	doc,
	Firestore,
	getDoc,
	getDocs,
	limit,
	query,
	runTransaction,
	updateDoc,
	where
} from "@angular/fire/firestore";
import { round } from "lodash";
import { map, Observable, } from "rxjs";

import {
	Group,
	GroupCode,
	isExpired,
	toFirestore,
	UpsertGroup
} from "../models/group.model";
import { generateRandomNumber } from "../utilities/common";
import { ErrorCode } from "../utilities/error-codes";
import { throwIfNotFound } from "../utilities/firebase-errors";

const GROUP_COLLECTION_NAME = "groups";
const GROUP_CODE_COLLECTION_NAME = "group_code";

@Injectable({
	providedIn: "root"
})
export class GroupService {
	private readonly firestore = inject(Firestore);

	getGroups$(userId: string): Observable<Group[]> {
		const ref = collection(this.firestore, GROUP_COLLECTION_NAME);
		const q = query(ref, where("memberIds", "array-contains", userId));
		return (collectionData(q, { idField: "id" }) as Observable<Group[]>).pipe(
			map(groupDocs => {
				const groups = groupDocs.map(group => {
					return {
						...group,
						groupTotal: round(group.groupTotal, 2),
						monthTotal: Object.fromEntries(
							Object.entries(group.monthTotal).map(([key, value]) => [key, round(value, 2)])
						),
					};
				});

				// TODO
				// const orderMap = keyBy(groupOrders, g => g.id);
				// return sortBy(groups, g => g.id ? orderMap[g.id].order : Number.MAX_SAFE_INTEGER);
				return groups;
			})
		);
	}

	async get(id: string): Promise<Group> {
		const ref = doc(this.firestore, GROUP_COLLECTION_NAME, id);
		const snapshot = await getDoc(ref);
		const group = throwIfNotFound(snapshot).data() as Group;

		return {
			...group,
			groupTotal: Math.ceil(group.groupTotal),
			monthTotal: Object.fromEntries(
				Object.entries(group.monthTotal).map(([key, value]) => [key, round(value, 2)])
			)
		};
	}

	async create(group: Group): Promise<string> {
		const ref = collection(this.firestore, GROUP_COLLECTION_NAME);
		const sanpshot = await addDoc(ref, group);
		return sanpshot.id;
	}

	update(id: string, group: UpsertGroup): Promise<void> {
		const ref = doc(this.firestore, GROUP_COLLECTION_NAME, id);
		return updateDoc(ref, { ...group });
	}

	async updateRole(id: string, memberId: string, roleToUpdate: "admin" | "user"): Promise<void> {
		const ref = doc(this.firestore, GROUP_COLLECTION_NAME, id);
		const sanapshot = await getDoc(ref);
		const group = throwIfNotFound(sanapshot).data() as Group;
		group.members[memberId].role = roleToUpdate;

		return updateDoc(ref, { members: group.members });
	}

	async removeMember(id: string, memberId: string): Promise<void> {
		const ref = doc(this.firestore, GROUP_COLLECTION_NAME, id);
		const sanapshot = await getDoc(ref);
		const group = throwIfNotFound(sanapshot).data() as Group;
		const member = group.memberIds.find(id => id === memberId);
		if (!member) {
			throw ErrorCode.USER_DOESNOT_BELONG_TO_GROUP;
		} else if (group.members[member].role === "admin" &&
			Object.values(group.members).filter(m => m.role === "admin").length === 1) {
			throw ErrorCode.NO_OTHER_ADMIN_FOUND;
		}

		group.memberIds = group.memberIds.filter(id => id != memberId);

		return updateDoc(ref, { memberIds: group.memberIds });
	}

	delete(userId: string, id: string): Promise<void> {
		const ref = doc(this.firestore, GROUP_COLLECTION_NAME, id);
		return runTransaction(this.firestore, async transaction => {
			const snapshot = await transaction.get(ref);
			const group = throwIfNotFound(snapshot).data() as Group;
			if (!this.isCurrentUserAuthorizedToUpdate(userId, group)) {
				throw ErrorCode.INVALID_PERMISSION;
			}

			transaction.delete(doc(this.firestore, GROUP_CODE_COLLECTION_NAME, id));
			transaction.delete(doc(collection(this.firestore, "groups", id, "expenses")));
			transaction.delete(ref);
		});
	}

	getCode(groupId: string): Promise<number> {
		const collectionRef = collection(this.firestore, GROUP_CODE_COLLECTION_NAME);
		return runTransaction(this.firestore, async (transaction) => {
			const groupDoc = await transaction.get(doc(collectionRef, groupId));
			if (!groupDoc.exists() || isExpired(groupDoc.data() as GroupCode)) {
				let newCode;
				do {
					newCode = generateRandomNumber();
				} while (!(await getDocs(query(collectionRef, where("code", "==", newCode)))).empty);

				transaction.set(doc(collectionRef, groupId), toFirestore(newCode));
				return newCode;
			}

			return (groupDoc.data() as GroupCode).code;
		});
	}

	async addMemeberToGroup(userId: string, name: string, code: number): Promise<string> {
		const ref = collection(this.firestore, GROUP_CODE_COLLECTION_NAME);
		const q = query(ref, where("code", "==", code), limit(1));

		const querySnapshot = await getDocs(q);
		if (querySnapshot.empty) {
			throw "Invalid code";
		}

		const groupCodeDoc = querySnapshot.docs[0];
		const groupCode = groupCodeDoc.data() as GroupCode;
		if (isExpired(groupCode)) {
			throw "Code expired.";
		} else if (+groupCode.code !== code) {
			throw "Invalide code";
		}

		const groupRef = doc(this.firestore, GROUP_COLLECTION_NAME, groupCodeDoc.id);
		const groupSnapshot = await getDoc(groupRef);
		const group = throwIfNotFound(groupSnapshot).data() as Group;
		const existingMemberId = group.memberIds.find(id => id === userId);
		if (!existingMemberId) {
			const memberIds = [...group.memberIds, userId];
			const members = { ...group.members };
			if (!group.members[userId]) {
				members[userId] = { id: userId, name };
			} else {
				members[userId].role = "user";
			}

			await updateDoc(groupRef, { memberIds, members });
		}

		return group.id;
	}

	private isCurrentUserAuthorizedToUpdate(userId: string | null, group: Group) {
		const currentMemberId = group.memberIds.find(id => id === userId);
		if (!currentMemberId || group.members[currentMemberId].role !== "admin") {
			throw "User is not authorised to perform this action";
		}

		return true;
	}
}
