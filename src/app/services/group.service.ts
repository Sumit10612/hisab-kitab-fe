import { inject, Injectable } from "@angular/core";
import {
	addDoc,
	collection,
	collectionData,
	deleteDoc,
	doc,
	docData,
	Firestore,
	getDocs,
	limit,
	query,
	runTransaction,
	updateDoc,
	where
} from "@angular/fire/firestore";
import { keyBy, round, sortBy } from "lodash";
import {
	concatMap,
	map,
	Observable,
	switchMap,
	take,
	tap
} from "rxjs";

import {
	Group,
	GroupCode,
	isExpired,
	toFirestore,
	UpsertGroup
} from "../models/group.model";
import { GroupOrder, User } from "../models/user.model";
import { generateRandomNumber } from "../utilities/common";
import { ErrorCode } from "../utilities/error-codes";
import { throwIfNotFound } from "../utilities/firebase-errors";

import { USER_COLLECTION_NAME, UserService } from "./user.service";
import { AuthService } from "./auth.service";

const GROUP_COLLECTION_NAME = "groups";

@Injectable({
	providedIn: "root"
})
export class GroupService {
	private readonly firestore = inject(Firestore);
	private readonly userService = inject(UserService);
	private readonly authService = inject(AuthService);

	private readonly docRef = (id: string) => doc(this.firestore, "groups", id);

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

	get$(groupId: string): Observable<Group> {
		return this.authService.user$.pipe(
			switchMap(user => (docData(this.docRef(groupId), { idField: "id" }) as Observable<Group>).pipe(
				take(1),
				map(group => {
					return {
						...group,
						groupTotal: Math.ceil(group.groupTotal),
						monthTotal: Object.fromEntries(
							Object.entries(group.monthTotal).map(([key, value]) => [key, round(value, 2)])
						),
						// TODO
						// members: group.members.map(member => member.id === user.uid ? { ...member, name: "You" } : member)
					} as Group;
				})
			))
		);
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

	updateRole$(id: string, memberId: string, roleToUpdate: "admin" | "user") {
		const ref = doc(this.firestore, GROUP_COLLECTION_NAME, id);
		return this.authService.user$.pipe(
			take(1),
			tap(user => runTransaction(this.firestore, async (transaction) => {
				const sanapshot = await transaction.get(ref);
				const group = throwIfNotFound(sanapshot).data() as Group;
				if (this.isCurrentUserAuthorizedToUpdate(user.uid, group)) {
					group.members[memberId].role = roleToUpdate;
					transaction.update(ref, { members: group.members });
				}
			}))
		);
	}

	removeMember$(groupId: string, memberId?: string) {
		const groupRef = this.docRef(groupId);
		return this.authService.user$.pipe(
			take(1),
			switchMap(user => runTransaction(this.firestore, async transaction => {
				const snapshot = await transaction.get(groupRef);
				const groupDoc = throwIfNotFound(snapshot).data() as Group;
				if (memberId && !this.isCurrentUserAuthorizedToUpdate(user.uid, groupDoc)) {
					throw new Error(ErrorCode.INVALID_PERMISSION);
				}

				memberId = memberId ?? user.uid;
				const member = groupDoc.memberIds.find(id => id === memberId);
				if (!member) {
					throw ErrorCode.USER_DOESNOT_BELONG_TO_GROUP;
				}

				if (groupDoc.members[member].role === "admin" &&
					Object.values(groupDoc.members).filter(m => m.role === "admin").length === 1) {
					throw new Error(ErrorCode.NO_OTHER_ADMIN_FOUND);
				}

				groupDoc.members[memberId].active = false;
				groupDoc.memberIds = groupDoc.memberIds.filter(id => id != memberId);
				transaction.update(groupRef, { members: groupDoc.members, memberIds: groupDoc.memberIds });
			}))
		);
	}

	delete(userId: string, id: string): Promise<void> {
		const ref = doc(this.firestore, GROUP_COLLECTION_NAME, id);
		return runTransaction(this.firestore, async transaction => {
			const snapshot = await transaction.get(ref);
			const group = throwIfNotFound(snapshot).data() as Group;
			if(!this.isCurrentUserAuthorizedToUpdate(userId, group)) {
				throw ErrorCode.INVALID_PERMISSION;
			}

			transaction.delete(doc(this.firestore, "group_code", id));
			transaction.delete(doc(collection(this.firestore, "groups", id, "expenses")));
			transaction.delete(ref);
		});
	}

	async getCode(groupId: string): Promise<number> {
		const collectionRef = collection(this.firestore, "group_code");
		return await runTransaction(this.firestore, async (transaction) => {
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

	addMemeberToGroup$(code: number): Observable<string> {
		const collectionRef = collection(this.firestore, "group_code");
		return this.userService.get$.pipe(
			take(1),
			switchMap(async user => {
				return await runTransaction(this.firestore, async transaction => {
					const querySnapshot = await getDocs(query(collectionRef, where("code", "==", code), limit(1)));
					if (querySnapshot.empty) {
						throw "Invalide code";
					}

					const groupCodeDoc = querySnapshot.docs[0];
					const groupCode = groupCodeDoc.data() as GroupCode;
					if (isExpired(groupCode)) {
						throw "Code expired.";
					} else if (+groupCode.code !== code) {
						throw "Invalide code";
					}

					// TODO
					// if (user.groupIds?.findIndex(groupId => groupId === groupCodeDoc.id) === 1) {
					// 	return groupCodeDoc.id;
					// }

					const groupRef = doc(this.firestore, "groups", groupCodeDoc.id);
					const groupSnapshot = await transaction.get(groupRef);
					const group = throwIfNotFound(groupSnapshot).data() as Group;
					
					const existingMemberId = group.memberIds.find(id => id === user.uid);
					if (existingMemberId) {
						group.members[existingMemberId].active = true;
					} else {
						group.memberIds.push(user.uid);
						group.members[user.uid] = {
							id: user.uid,
							name: user.name ?? "",
							active: true,
						};
					}

					transaction.update(groupRef, { members: group.members });

					return groupCodeDoc.id;
				});
			})
		);
	}

	private isCurrentUserAuthorizedToUpdate(userId: string | null, group: Group) {
		const currentMemberId = group.memberIds.find(id => id === userId);
		if (!currentMemberId || group.members[currentMemberId].role !== "admin") {
			throw "User is not authorised to perform this action";
		}

		return true;
	}
}
