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

import { GroupCode, isExpired, toFirestore } from "../models/group-code.model";
import { generateRandomNumber } from "../utilities/common";
import { AuthService } from "./auth.service";
import { map, Observable, switchMap, take } from "rxjs";
import { User } from "../models/user.model";
import { Group, GroupMember } from "../models/group.model";

@Injectable({
	providedIn: "root"
})
export class GroupCodeService {
	private readonly fireStore = inject(Firestore);
	private readonly authService = inject(AuthService);

	async getCode(groupId: string): Promise<number> {
		const collectionRef = collection(this.fireStore, "group_code");
		return await runTransaction(this.fireStore, async (transaction) => {
			const groupDoc = await transaction.get(doc(collectionRef, groupId));
			if(!groupDoc.exists() || isExpired(groupDoc.data() as GroupCode)) {
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
		return this.authService.currentUser$.pipe(
			take(1),
			switchMap(async currentUser => {
				if(!currentUser) {
					throw "User not found";
				}

				const userRef = doc(this.fireStore, "users", currentUser?.uid);
				const collectionRef = collection(this.fireStore, "group_code");

				return await runTransaction(this.fireStore, async transaction => {
					const userDoc = await transaction.get(userRef);
					if(!userDoc.exists()) {
						throw "User not available";
					}

					const userData = userDoc.data() as User;

					const querySnapshot = await getDocs(query(collectionRef, where("code", "==", code), limit(1)));
					if(querySnapshot.empty) {
						throw "Invalide code";
					}

					const groupCodeDoc = querySnapshot.docs[0];
					const groupCode = groupCodeDoc.data() as GroupCode;
					if(isExpired(groupCode)) {
						throw "Code expired."
					} else if(+groupCode.code !== code) {
						throw "Invalide code";
					}

					const groups = [...userData.groups ?? [], groupCodeDoc.id]

					const groupRef = doc(this.fireStore, "groups", groupCodeDoc.id);
					const groupSnapshot = await transaction.get(groupRef);
					if(!groupSnapshot.exists()) {
						throw "Group doesnot exists";
					}

					const group = groupSnapshot.data() as Group;
					const members = [
						...group.members ?? [],
						{ id: userData.uid, name: userData.name } as GroupMember
					]

					transaction.update(groupRef, { members });
					transaction.update(userRef, { groups });

					return groupCodeDoc.id;
				});
			})
		)
	}
}
