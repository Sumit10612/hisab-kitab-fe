import { Injectable, inject } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { addDoc, collection, documentId, getDocs, query, where } from 'firebase/firestore';
import { Observable, from, map, of, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

import { UserService } from './user.service';
import { Group } from '../models/group.model';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private firestore = inject(Firestore);
  private userService = inject(UserService);

  private myGroups$: Observable<Group[]> = this.userService.user$.pipe(
    switchMap((user) => {
      if (!user || !user.groups || user.groups.length === 0) {
        return of([]);
      }
      
      const q = query(collection(this.firestore, "groups"), where(documentId(), "in", user.groups));
      return from(getDocs(q)).pipe(
        map(snapshot => {
          const groups: Group[] = [];
          snapshot.forEach((doc) =>  groups.push({ uid: doc.id, ...doc.data() } as Group));
          return groups;
        })
      );
    })
  );
  
  myGroups = toSignal(this.myGroups$);

  async createGroup(name: string, icon: string): Promise<string> {
    const docRef = await addDoc(collection(this.firestore, "groups"), { 
      name, 
      icon 
    });
    return Promise.resolve(docRef.id)
  }
}
