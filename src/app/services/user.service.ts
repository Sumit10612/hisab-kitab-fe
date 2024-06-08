import { inject, Injectable } from "@angular/core";
import { Firestore, getDoc } from "@angular/fire/firestore";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { docData,  } from "rxfire/firestore";
import { Observable, switchMap } from "rxjs";

import { User } from "../models/user.model";

import { AuthService } from "./auth.service";

export const USER_COLLECTION_NAME = "users";

@Injectable({
	providedIn: "root"
})
export class UserService {
	private readonly firestore = inject(Firestore);
	private readonly authService = inject(AuthService);

	get$ = this.authService.user$.pipe(
		switchMap(user => docData(doc(this.firestore, USER_COLLECTION_NAME, user.uid)) as Observable<User>)
	);

	async get(id: string): Promise<User> {
		const docSnapshot = await getDoc(doc(this.firestore, USER_COLLECTION_NAME, id));
		return docSnapshot.data() as User;
	}

	add(user: User): Promise<void> {
		return setDoc(doc(this.firestore, USER_COLLECTION_NAME, user.uid), user);
	}

	update(user: User): Promise<void> {
		return updateDoc(doc(this.firestore, USER_COLLECTION_NAME, user.uid), { ...user });
	}
}
