import { FirebaseError } from "firebase/app";

export const getFirebaseErrorMessage = ({ code }: FirebaseError): string => {
    let message;
    switch (code) {
        case "auth/invalid-credential":
            message = "Invalid user credential."
            break;
        case "auth/weak-password":
            message = "Password should be at least 6 characters."
            break;
        case "auth/email-already-in-use":
            message = "The user with email already exists."
            break;
        default:
            message = "An unspecified error occurred. Please contact the system administrator."
    }

    return message;
}