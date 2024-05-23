import { inject, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { Firestore } from "@angular/fire/firestore";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { docData } from "rxfire/firestore";
import { Observable, switchMap, take } from "rxjs";

import { User } from "../models/user.model";

import { AuthService } from "./auth.service";

@Injectable({
	providedIn: "root"
})
export class UserService {
	firestore = inject(Firestore);
	authService = inject(AuthService);

	private docRef = (id: string) => doc(this.firestore, "users", id);

	user$ = this.authService.currentUser$.pipe(
		take(1),
		switchMap((user) => docData(this.docRef(user.uid)) as Observable<User>)
	);

	currentUser = toSignal(this.user$);

	addUser(user: User): Promise<void> {
		return setDoc(this.docRef(user.uid), user);
	}

	updateUser(user: User): Promise<void> {
		return updateDoc(this.docRef(user.uid), { ...user });
	}
}
