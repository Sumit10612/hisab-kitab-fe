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
	where
} from "@angular/fire/firestore";
import {
	from,
	map,
	Observable,
	of,
	switchMap
} from "rxjs";

import { CreateGroup, Group } from "../models/group.model";

import { UserService } from "./user.service";

@Injectable({
	providedIn: "root"
})
export class GroupService {
	private firestore = inject(Firestore);
	private userService = inject(UserService);

	private myGroups$: Observable<Group[]> = this.userService.user$.pipe(
		switchMap((user) => {
			if (!user || !user.groups || user.groups.length === 0) {
				return of([]);
			}
      
			const q = query(collection(this.firestore, "groups"), where(documentId(), "in", user.groups));
			return from(getDocs(q)).pipe(
				map(snapshot => {
					const groups: Group[] = [];
					snapshot.forEach((doc) =>  groups.push({ uid: doc.id, ...doc.data() } as Group));
					return groups;
				})
			);
		})
	);

	currentGroup$(groupId: string): Observable<Group> {
		const ref = doc(this.firestore, "groups", groupId);
		return docData(ref) as Observable<Group>;
	}
  
	myGroups = toSignal(this.myGroups$);

	async createGroup(group: CreateGroup): Promise<string> {
		const docRef = await addDoc(collection(this.firestore, "groups"), group);
		return Promise.resolve(docRef.id);
	}
}
