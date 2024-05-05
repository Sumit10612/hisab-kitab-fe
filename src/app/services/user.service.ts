import { Injectable, inject } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { User } from '../models/user.model';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { AuthService } from './auth.service';
import { Observable, of, switchMap } from 'rxjs';
import { docData } from 'rxfire/firestore';
import { toSignal } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  firestore = inject(Firestore);
  authService = inject(AuthService);

  user$ = this.authService.currentUser$.pipe(
    switchMap((user) => {
      if(!user) {
        return of(null);
      }

      const ref = doc(this.firestore, 'users', user?.uid);
      return docData(ref) as Observable<User>;
    })
  );

  currentUser = toSignal(this.user$);

  addUser(user: User): Promise<void> {
    const ref = doc(this.firestore, 'users', user.uid);
    return setDoc(ref, user);
  }

  updateUser(user: User): Promise<void> {
    const ref = doc(this.firestore, 'users', user.uid);
    return updateDoc(ref, { ...user });
  }
}
