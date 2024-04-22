import { Injectable, inject } from '@angular/core';
import { 
  Auth, 
  GoogleAuthProvider, 
  User, 
  UserCredential, 
  authState, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  updateProfile
} from '@angular/fire/auth';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  firebaseAuth = inject(Auth);

  currentUser = toSignal(authState(this.firebaseAuth));
  private googleProvider = new GoogleAuthProvider();

  login(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.firebaseAuth, email, password);
  }

  googleSignIn(): Promise<UserCredential> {
    return signInWithPopup(this.firebaseAuth, this.googleProvider)
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

  setDisplayName(user: User, name?: string | null) {
    return updateProfile(user, { displayName: name });
  }
}
