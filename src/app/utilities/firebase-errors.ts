import { DocumentData, DocumentSnapshot } from "@angular/fire/firestore";
import { FirebaseError } from "firebase/app";

import { ErrorCode } from "./error-codes";

export const getFirebaseErrorMessage = (err: unknown): string => {
	if (err instanceof FirebaseError) {
		switch (err.code) {
			case "auth/invalid-credential":
				return "Invalid user credential.";
			case "auth/weak-password":
				return "Password should be at least 6 characters.";
			case "auth/email-already-in-use":
				return "The user with email already exists.";
		}
	}

	console.log(err);

	return "An unspecified error occurred. Please contact the system administrator.";
};

export const throwIfNotFound = (
	snapshot: DocumentSnapshot<DocumentData, DocumentData>,
	message?: string
): DocumentSnapshot<DocumentData, DocumentData> => {
	if (!snapshot.exists()) {
		throw `${ErrorCode.NOT_FOUND}: ${message}`;
	}

	return snapshot;
};
