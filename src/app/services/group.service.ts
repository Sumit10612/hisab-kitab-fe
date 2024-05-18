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
import {
	concatMap,
	filter,
	Observable,
	switchMap,
	take,
} from "rxjs";

import { Group } from "../models/group.model";

import { UserService } from "./user.service";
import { User } from "../models/user.model";

@Injectable({
	providedIn: "root"
})
export class GroupService {
	private firestore = inject(Firestore);
	private userService = inject(UserService);

	myGroups$ = this.userService.user$.pipe(
		filter(user => !!user),
		switchMap(user => {
			const ref = collection(this.firestore, "groups");
			const q = query(ref, where(documentId(), "in", user?.groups));
			return collectionData(q, { idField: "id" }) as Observable<Group[]>;
		})
	);

	get$(groupId: string): Observable<Group> {
		const ref = doc(this.firestore, "groups", groupId);
		return docData(ref, { idField: "id" }) as Observable<Group>;
	}

	create$(group: Group): Observable<string> {
		const ref = doc(collection(this.firestore, "groups"));
		return this.userService.user$.pipe(
			take(1),
			concatMap(user => runTransaction(this.firestore, async (transction) => {
				if(!user) {
					throw new Error("user not found");
				}

				const userDocRef = doc(this.firestore, "users", user.uid);
				const userGroups = ((await transction.get(userDocRef)).data() as User).groups ?? [];

				transction.set(ref, {
					...group,
					members: [{
						id: user.uid,
						name: user.name
					}]
				} as Group);

				
				transction.update(userDocRef, {
					groups: [...userGroups, ref.id]
				});

				return ref.id;
			}))
		);
	}

	delete(groupId: string): Promise<void> {
		const groupRef = doc(this.firestore, "groups", groupId);
		const usersRef = collection(this.firestore, "users");
		const q = query(usersRef, where("groups", "array-contains", groupId));
		return runTransaction(this.firestore, async (transaction) => {
			const usersSnapshot = await getDocs(q);
			usersSnapshot.forEach(userDoc => {
				const userRef = doc(this.firestore, "users", userDoc.id);
				const groups = (userDoc.data() as User).groups ?? [];
				transaction.update(userRef, {
					groups: groups.filter(group => groupId !== group)
				});
			});

			transaction.delete(groupRef);
		});
	}
}
