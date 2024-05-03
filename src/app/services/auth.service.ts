import { Injectable, inject } from '@angular/core';
import { 
  Auth, 
  GoogleAuthProvider,
  UserCredential, 
  authState, 
  createUserWithEmailAndPassword, 
  getAdditionalUserInfo, 
  sendPasswordResetEmail, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut
} from '@angular/fire/auth';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  firebaseAuth = inject(Auth);

  private googleProvider = new GoogleAuthProvider();

  currentUser$ = authState(this.firebaseAuth);

  login(email: string, password: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(this.firebaseAuth, email, password);
  }

  async googleSignIn(): Promise<User | null> {
    const userCredential = await signInWithPopup(this.firebaseAuth, this.googleProvider);
    const info = getAdditionalUserInfo(userCredential);

    if(!info?.isNewUser) {
      return Promise.resolve(null);
    }

    const { user: { displayName, uid, email } } = userCredential;

    return Promise.resolve({
      uid: uid,
      name: displayName ?? '',
      email: email ?? ''
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
