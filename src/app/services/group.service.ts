import { inject, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import {
	addDoc,
	collection,
	doc,
	docData,
	documentId,
	Firestore,
	getDocs,
	query,
	where,
	deleteDoc,
	collectionData
} from "@angular/fire/firestore";
import {
	concatMap,
	firstValueFrom,
	from,
	map,
	Observable,
	of,
	switchMap,
	take,
	tap
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
	)};

	currentGroup$(groupId: string): Observable<Group> {
		const ref = doc(this.firestore, "groups", groupId);
		return docData(ref, { idField: "uid" }) as Observable<Group>;
	};

	groupExpenses$(groupId: string): Observable<GroupExpenses> {
		const ref = doc(this.firestore, "group_expenses", groupId);
		return docData(ref, { idField: "groupId" }) as Observable<GroupExpenses>;
	}
  
	$myGroups = toSignal(this.myGroups$);

	createGroup = (group: CreateGroup) => firstValueFrom(this.createGroup$(group));

	private createGroup$(createGroup: CreateGroup): Observable<string> {
		const ref = collection(this.firestore,"groups");
		return this.userService.user$.pipe(
			take(1),
			concatMap(user => addDoc(ref, {
				name: createGroup.name,
				imageUrl: createGroup.imageUrl,
				userIds: [user?.uid ?? ''],
				users: [{
					uid: user?.uid ?? '',
					name: user?.name,
					photoUrl: user?.photoUrl,
					role: "admin"
				} as GroupUser]
			} as Group)),
			map(ref => ref.id)
		);
	}

	deleteGroup(groupId: string): Promise<void> {
		const ref = doc(this.firestore, "groups", groupId);
		return deleteDoc(ref);
	}
}
