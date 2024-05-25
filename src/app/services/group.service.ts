import { inject, Injectable } from "@angular/core";
import {
	collection,
	collectionData,
	doc,
	docData,
	documentId,
	Firestore,
	getDocs,
	query,
	runTransaction,
	where
} from "@angular/fire/firestore";
import { round } from "lodash";
import {
	concatMap,
	filter,
	map,
	Observable,
	switchMap,
	take,
	tap
} from "rxjs";

import { Group } from "../models/group.model";
import { User } from "../models/user.model";
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
			const q = query(this.collectionRef(), where(documentId(), "in", user?.groups));
			return (collectionData(q, { idField: "id" }) as Observable<Group[]>).pipe(
				map(groups => groups.map(group => {
					return {
						...group,
						groupTotal: round(group.groupTotal, 2),
						monthTotal: Object.fromEntries(
							Object.entries(group.monthTotal).map(([key, value]) => [key, round(value, 2)])
						),
					};
				}))
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
					}]
				} as Group);

				transction.update(doc(this.firestore, "users", user.uid), {
					groups: [...user?.groups ?? [], ref.id]
				});

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
				const filterGroups = userDoc.groups?.filter(id => id !== groupId);

				const members = groupDoc.members.filter(m => m.id !== memberId);

				transaction.update(userRef, { groups: filterGroups });
				transaction.update(groupRef, { members });

			}))
		);
	}

	delete$(groupId: string) {
		const groupRef = this.docRef(groupId);
		const q = query(collection(this.firestore, "users"), where("groups", "array-contains", groupId));

		return this.userService.authService.currentUser$.pipe(
			take(1),
			switchMap(user => runTransaction(this.firestore, async (transaction) => {
				const groupSnapshot = await transaction.get(groupRef);
				const groupDoc = throwIfNotFound(groupSnapshot).data() as Group;
				if (!this.isCurrentUserAuthorizedToUpdate(user.uid, groupDoc)) {
					throw ErrorCode.INVALID_PERMISSION;
				}

				const usersSnapshot = await getDocs(q);
				usersSnapshot.forEach(userDoc => {
					const userRef = doc(this.firestore, "users", userDoc.id);
					const groups = (userDoc.data() as User).groups ?? [];
					transaction.update(userRef, {
						groups: groups.filter(id => id !== groupId)
					});
				});

				transaction.delete(doc(this.firestore, "group_code", groupId));
				transaction.delete(doc(collection(this.firestore, "groups", groupId, "expenses")));
				transaction.delete(groupRef);
			}))
		);
	}

	private isCurrentUserAuthorizedToUpdate(userId: string | null, group: Group) {
		const currentMember = group.members.find(member => member.id === userId);
		if (!currentMember || currentMember.role !== "admin") {
			throw "User is not authorised to perform this action";
		}

		return true;
	}
}
