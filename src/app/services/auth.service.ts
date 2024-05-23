import { inject, Injectable } from "@angular/core";
import {
	Auth,
	authState,
	createUserWithEmailAndPassword,
	getAdditionalUserInfo,
	GoogleAuthProvider,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	signInWithPopup,
	signOut,
	UserCredential
} from "@angular/fire/auth";
import { map } from "rxjs";

import { User } from "../models/user.model";
import { ErrorCode } from "../utilities/error-codes";

@Injectable({
	providedIn: "root"
})
export class AuthService {
	firebaseAuth = inject(Auth);

	private googleProvider = new GoogleAuthProvider();

	currentUser$ = authState(this.firebaseAuth).pipe(
		map(user => {
			if (!user) {
				throw ErrorCode.UNAUTHORIZED;
			}
			return user;
		})
	);

	login(email: string, password: string): Promise<UserCredential> {
		return signInWithEmailAndPassword(this.firebaseAuth, email, password);
	}

	async googleSignIn(): Promise<User | null> {
		const userCredential = await signInWithPopup(this.firebaseAuth, this.googleProvider);
		const info = getAdditionalUserInfo(userCredential);

		if (!info?.isNewUser) {
			return Promise.resolve(null);
		}

		const { user: { displayName, uid, email } } = userCredential;

		return Promise.resolve({
			uid: uid,
			name: displayName ?? "",
			email: email ?? ""
		});
	}

	logout(): Promise<void> {
		return signOut(this.firebaseAuth);
	}

	signUp(email: string, password: string): Promise<UserCredential> {
		return createUserWithEmailAndPassword(this.firebaseAuth, email, password);
	}

	passwordReset(email: string): Promise<void> {
		return sendPasswordResetEmail(this.firebaseAuth, email);
	}
}
