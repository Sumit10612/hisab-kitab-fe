import { FirebaseError } from "firebase/app";

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

    return "An unspecified error occurred. Please contact the system administrator.";
};
