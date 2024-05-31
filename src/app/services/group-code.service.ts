import { inject, Injectable } from "@angular/core";
import {
	collection,
	doc,
	Firestore,
	getDocs,
	limit,
	query
} from "@angular/fire/firestore";
import { runTransaction, where } from "firebase/firestore";
import { Observable, switchMap, take } from "rxjs";

import { GroupCode, isExpired, toFirestore } from "../models/group-code.model";
import { Group, GroupMember } from "../models/group.model";
import { GroupOrder } from "../models/user.model";
import { generateRandomNumber } from "../utilities/common";
import { throwIfNotFound } from "../utilities/firebase-errors";

import { UserService } from "./user.service";

@Injectable({
	providedIn: "root"
})
export class GroupCodeService {
	private readonly fireStore = inject(Firestore);
	private readonly userService = inject(UserService);

	async getCode(groupId: string): Promise<number> {
		const collectionRef = collection(this.fireStore, "group_code");
		return await runTransaction(this.fireStore, async (transaction) => {
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
		const collectionRef = collection(this.fireStore, "group_code");
		return this.userService.user$.pipe(
			take(1),
			switchMap(async user => {
				return await runTransaction(this.fireStore, async transaction => {
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

					const groupRef = doc(this.fireStore, "groups", groupCodeDoc.id);
					const groupSnapshot = await transaction.get(groupRef);
					const group = throwIfNotFound(groupSnapshot).data() as Group;

					const members = [
						...group.members ?? [],
						{ id: user.uid, name: user.name } as GroupMember
					];

					transaction.update(groupRef, { members });
					transaction.update(doc(this.fireStore, "users", user.uid), { 
						groupIds: [...user.groupIds ?? [], groupCodeDoc.id] as string[],
						groups: [...user.groups ?? [], { id: groupCodeDoc.id, order: Number.MAX_SAFE_INTEGER }] as GroupOrder[],
					});

					return groupCodeDoc.id;
				});
			})
		);
	}
}
