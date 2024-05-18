import { inject, Injectable } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { Firestore } from "@angular/fire/firestore";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { docData } from "rxfire/firestore";
import { Observable, of, switchMap, take } from "rxjs";

import { User } from "../models/user.model";

import { AuthService } from "./auth.service";

@Injectable({
	providedIn: "root"
})
export class UserService {
	firestore = inject(Firestore);
	authService = inject(AuthService);

	user$ = this.authService.currentUser$.pipe(
		take(1),
		switchMap((user) => {
			if(!user) {
				return of(null);
			}

			const ref = doc(this.firestore, "users", user?.uid);
			return docData(ref) as Observable<User>;
		})
	);

	currentUser = toSignal(this.user$);

	addUser(user: User): Promise<void> {
		const ref = doc(this.firestore, "users", user.uid);
		return setDoc(ref, user);
	}

	updateUser(user: User): Promise<void> {
		const ref = doc(this.firestore, "users", user.uid);
		return updateDoc(ref, { ...user });
	}
}
