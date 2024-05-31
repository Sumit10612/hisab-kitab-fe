import { inject, Injectable } from "@angular/core";
import {
	collection,
	collectionData,
	doc,
	docData,
	documentId,
	Firestore,
	getDocs,
	limit,
	query,
	runTransaction,
	where
} from "@angular/fire/firestore";
import { keyBy, round, sortBy } from "lodash";
import {
	concatMap,
	filter,
	map,
	Observable,
	switchMap,
	take,
	tap
} from "rxjs";

import { Group, GroupCode, isExpired, toFirestore } from "../models/group.model";
import { GroupOrder, User } from "../models/user.model";
import { generateRandomNumber } from "../utilities/common";
import { ErrorCode } from "../utilities/error-codes";
import { throwIfNotFound } from "../utilities/firebase-errors";

import { UserService } from "./user.service";

@Injectable({
	providedIn: "root"
})
export class GroupService {
	private readonly firestore = inject(Firestore);
	private readonly userService = inject(UserService);

	private readonly collectionRef = () => collection(this.firestore, "groups");
	private readonly docRef = (id: string) => doc(this.firestore, "groups", id);

	myGroups$: Observable<Group[]> = this.userService.user$.pipe(
		filter(user => !!user),
		switchMap(user => {
			const q = query(this.collectionRef(), where(documentId(), "in", user.groupIds));
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

					const orderMap = keyBy(user.groups, g => g.id);
					return sortBy(groups, g => g.id ? orderMap[g.id].order : Number.MAX_SAFE_INTEGER);
				})
			);
		})
	);

	get$(groupId: string): Observable<Group> {
		return this.userService.authService.currentUser$.pipe(
			switchMap(user => (docData(this.docRef(groupId), { idField: "id" }) as Observable<Group>).pipe(
				map(group => {
					return {
						...group,
						groupTotal: Math.ceil(group.groupTotal),
						monthTotal: Object.fromEntries(
							Object.entries(group.monthTotal).map(([key, value]) => [key, round(value, 2)])
						),
						members: group.members.map(member => member.id === user.uid ? { ...member, name: "You" } : member)
					} as Group;
				})
			))
		);
	}

	create$(group: Group): Observable<string> {
		const ref = doc(this.collectionRef());
		return this.userService.user$.pipe(
			take(1),
			concatMap(user => runTransaction(this.firestore, async (transction) => {
				transction.set(ref, {
					...group,
					members: [{
						id: user.uid,
						name: user.name,
						role: "admin",
						active: true,
					}]
				} as Group);

				transction.update(doc(this.firestore, "users", user.uid), this.addGroupToUser(user, ref.id));

				return ref.id;
			}))
		);
	}

	update$(groupId: string, name: string): Observable<void> {
		const ref = this.docRef(groupId);
		return this.userService.authService.currentUser$.pipe(
			take(1),
			switchMap(user => runTransaction(this.firestore, async (transaction) => {
				const sanapshot = await transaction.get(ref);
				const groupDoc = throwIfNotFound(sanapshot).data() as Group;
				if (this.isCurrentUserAuthorizedToUpdate(user.uid, groupDoc)) {
					transaction.update(ref, {
						name,
					});
				}
			}))
		);
	}

	updateRole$(groupId: string, memberId: string, roleToUpdate: "admin" | "user") {
		const ref = this.docRef(groupId);
		return this.userService.authService.currentUser$.pipe(
			take(1),
			tap(user => runTransaction(this.firestore, async (transaction) => {
				const sanapshot = await transaction.get(ref);
				const groupDoc = throwIfNotFound(sanapshot).data() as Group;
				if (this.isCurrentUserAuthorizedToUpdate(user.uid, groupDoc)) {
					transaction.update(ref, {
						members: groupDoc.members.map(
							member => member.id === memberId ? { ...member, role: roleToUpdate } : member
						)
					});
				}
			}))
		);
	}

	removeMember$(groupId: string, memberId?: string) {
		const groupRef = this.docRef(groupId);
		return this.userService.authService.currentUser$.pipe(
			take(1),
			switchMap(user => runTransaction(this.firestore, async transaction => {
				const snapshot = await transaction.get(groupRef);
				const groupDoc = throwIfNotFound(snapshot).data() as Group;
				if (memberId && !this.isCurrentUserAuthorizedToUpdate(user.uid, groupDoc)) {
					throw new Error(ErrorCode.INVALID_PERMISSION);
				}

				memberId = memberId ?? user.uid;
				const member = groupDoc.members.find(member => member.id === memberId);
				if (!member) {
					throw ErrorCode.USER_DOESNOT_BELONG_TO_GROUP;
				}

				if (member.role === "admin" &&
					groupDoc.members.filter(m => m.role === "admin").length === 1) {
					throw new Error(ErrorCode.NO_OTHER_ADMIN_FOUND);
				}

				const userRef = doc(this.firestore, "users", memberId);
				const userSnapshot = await transaction.get(userRef);
				const userDoc = throwIfNotFound(userSnapshot).data() as User;

				const members = groupDoc.members.map(m => {
					if (m.id === memberId) {
						m.active = false;
						m.role = "user";
					}
					return m;
				});

				transaction.update(userRef, this.filterUserGroups(userDoc, groupId));
				transaction.update(groupRef, { members });
			}))
		);
	}

	delete$(groupId: string) {
		const groupRef = this.docRef(groupId);
		const q = query(collection(this.firestore, "users"), where("groupIds", "array-contains", groupId));

		return this.userService.authService.currentUser$.pipe(
			take(1),
			switchMap(user => runTransaction(this.firestore, async (transaction) => {
				const groupSnapshot = await transaction.get(groupRef);
				const groupDoc = throwIfNotFound(groupSnapshot).data() as Group;
				if (!this.isCurrentUserAuthorizedToUpdate(user.uid, groupDoc)) {
					throw ErrorCode.INVALID_PERMISSION;
				}

				const usersSnapshot = await getDocs(q);
				usersSnapshot.forEach(userSanpshot => {
					const userRef = doc(this.firestore, "users", userSanpshot.id);
					const userDoc = userSanpshot.data() as User;
					transaction.update(userRef, this.filterUserGroups(userDoc, groupId));
				});

				transaction.delete(doc(this.firestore, "group_code", groupId));
				transaction.delete(doc(collection(this.firestore, "groups", groupId, "expenses")));
				transaction.delete(groupRef);
			}))
		);
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
		return this.userService.user$.pipe(
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

					if (user.groupIds?.findIndex(groupId => groupId === groupCodeDoc.id) === 1) {
						return groupCodeDoc.id;
					}

					const groupRef = doc(this.firestore, "groups", groupCodeDoc.id);
					const groupSnapshot = await transaction.get(groupRef);
					const group = throwIfNotFound(groupSnapshot).data() as Group;
					
					const memberExists = group.members.find(member => member.id === user.uid);
					if (memberExists) {
						memberExists.active = true;
					} else {
						group.members.push({
							id: user.uid,
							name: user.name ?? "",
							active: true,
						});
					}

					transaction.update(groupRef, { members: group.members });
					transaction.update(doc(this.firestore, "users", user.uid), this.addGroupToUser(user, groupCodeDoc.id));

					return groupCodeDoc.id;
				});
			})
		);
	}

	private isCurrentUserAuthorizedToUpdate(userId: string | null, group: Group) {
		const currentMember = group.members.find(member => member.id === userId);
		if (!currentMember || currentMember.role !== "admin") {
			throw "User is not authorised to perform this action";
		}

		return true;
	}

	private filterUserGroups(user: User, groupId: string) {
		return {
			groupIds: user.groupIds?.filter(id => id !== groupId) as string[],
			groups: user.groups?.filter(g => g.id !== groupId) as GroupOrder[],
		};
	}

	private addGroupToUser(user: User, groupId: string) {
		return { 
			groupIds: [...user.groupIds ?? [], groupId] as string[],
			groups: [...user.groups ?? [], { id: groupId, order: Number.MAX_SAFE_INTEGER }] as GroupOrder[],
		};
	}
}
