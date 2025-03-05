import { inject, Injectable } from "@angular/core";
import { doc, Firestore, getDoc, setDoc, updateDoc } from "@angular/fire/firestore";

import { User } from "../models/user.model";

export const USER_COLLECTION_NAME = "users";

@Injectable({
	providedIn: "root"
})
export class UserService {
	private readonly firestore = inject(Firestore);

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
