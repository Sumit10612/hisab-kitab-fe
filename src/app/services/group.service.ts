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
	updateDoc,
	where
} from "@angular/fire/firestore";
import {
	concatMap,
	filter,
	map,
	Observable,
	switchMap,
	take,
} from "rxjs";

import { Group } from "../models/group.model";
import { User } from "../models/user.model";

import { UserService } from "./user.service";

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

	get$(id: string): Observable<Group> {
		return this.userService.user$.pipe(
			switchMap(user => {
				if(!user) {
					throw "User not found";
				}

				const ref = doc(this.firestore, "groups", id);
				return (docData(ref, { idField: "id" }) as Observable<Group>).pipe(
					map(group => {
						return {
							...group,
							members: group.members.map(member => member.id === user.uid ? { ...member, name: "You" } : member)
						} as Group;
					})
				);
			})
		);
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
						name: user.name,
						role: "admin",
					}]
				} as Group);
				
				transction.update(userDocRef, {
					groups: [...userGroups, ref.id]
				});

				return ref.id;
			}))
		);
	}

	update(id: string, name: string, imageUrl: string): Promise<void> {
		const ref = doc(this.firestore, "groups", id);
		return updateDoc(ref, {
			name,
			imageUrl
		});
	}

	delete(id: string): Promise<void> {
		const groupRef = doc(this.firestore, "groups", id);
		const usersRef = collection(this.firestore, "users");
		const q = query(usersRef, where("groups", "array-contains", id));
		return runTransaction(this.firestore, async (transaction) => {
			const usersSnapshot = await getDocs(q);
			usersSnapshot.forEach(userDoc => {
				const userRef = doc(this.firestore, "users", userDoc.id);
				const groups = (userDoc.data() as User).groups ?? [];
				transaction.update(userRef, {
					groups: groups.filter(groupId => id !== groupId)
				});
			});

			transaction.delete(groupRef);
		});
	}
}
