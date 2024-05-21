import { inject, Injectable } from "@angular/core";
import {
	collection,
	deleteDoc,
	doc,
	Firestore,
	getDocs,
	query
} from "@angular/fire/firestore";
import { runTransaction, where } from "firebase/firestore";

import { GroupCode, isExpired, toFirestore } from "../models/group-code.model";
import { generateRandomNumber } from "../utilities/common";

@Injectable({
	providedIn: "root"
})
export class GroupCodeService {
	private readonly fireStore = inject(Firestore);

	async getCode(groupId: string): Promise<number> {
		const collectionRef = collection(this.fireStore, "group_code");
		return await runTransaction(this.fireStore, async (transaction) => {
			const groupDoc = await transaction.get(doc(collectionRef, groupId));
			if(!groupDoc.exists() || isExpired(groupDoc.data() as GroupCode)) {
				let newCode;
				do {
					newCode = generateRandomNumber();
				} while (!(await getDocs(query(collectionRef, where("code", "==", newCode)))).empty);

				transaction.set(doc(collectionRef, groupId), toFirestore(newCode));
				return newCode;
			}

			return (groupDoc.data() as GroupCode).code;
		});
	}

	deleteCode(groupId: string): Promise<void> {
		const ref = doc(this.fireStore, "group_code", groupId);
		return deleteDoc(ref);
	}
}
