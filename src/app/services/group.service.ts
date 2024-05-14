import { inject, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
	collection,
	collectionData,
	deleteDoc,
	doc,
	docData,
	Firestore,
	query,
	runTransaction,
	where
} from "@angular/fire/firestore";
import {
	Observable,
	switchMap,
} from "rxjs";

import { CreateGroup, Group, GroupExpenses, GroupUser } from "../models/group.model";

import { UserService } from "./user.service";

@Injectable({
	providedIn: "root"
})
export class GroupService {
	private firestore = inject(Firestore);
	private userService = inject(UserService);

	private get myGroups$(): Observable<Group[]> {
		const ref = collection(this.firestore, "groups");
		return this.userService.user$.pipe(
			switchMap((user) => {      
				const q = query(ref, where("userIds", "array-contains", user?.uid));
				return collectionData(q, { idField: "uid" }) as Observable<Group[]>;
			})
		);}

	currentGroup$(groupId: string): Observable<Group> {
		const ref = doc(this.firestore, "groups", groupId);
		return docData(ref, { idField: "uid" }) as Observable<Group>;
	}

	groupExpenses$(groupId: string): Observable<GroupExpenses> {
		const ref = doc(this.firestore, "group_expenses", groupId);
		return docData(ref, { idField: "groupId" }) as Observable<GroupExpenses>;
	}
  
	$myGroups = toSignal(this.myGroups$);

	createGroup(createGroup: CreateGroup): Promise<void> {
		const groupRef = doc(collection(this.firestore, "groups"));
		const groupExpenseRef = doc(this.firestore, "group_expenses", groupRef.id);

		return runTransaction(this.firestore, async (transation) => {
			const user = this.userService.currentUser();
			if(user) {
				transation.set(groupRef, {
					name: createGroup.name,
					imageUrl: createGroup.imageUrl,
					userIds: [user?.uid ?? ""],
					users: [{
						uid: user?.uid ?? "",
						name: user?.name,
						photoUrl: user?.photoUrl,
						role: "admin"
					} as GroupUser]
				} as Group);

				transation.set(groupExpenseRef, {
					groupId: groupRef.id
				} as GroupExpenses);
			}
		});
	}

	deleteGroup(groupId: string): Promise<void> {
		const ref = doc(this.firestore, "groups", groupId);
		return deleteDoc(ref);
	}
}
