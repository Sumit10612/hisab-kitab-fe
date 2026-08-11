import { inject, Injectable } from "@angular/core";
import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    collectionChanges,
    CollectionReference,
    doc,
    Firestore,
    getDoc,
    getDocs,
    limit,
    query,
    runTransaction,
    Timestamp,
    updateDoc,
    UpdateData,
    where,
    writeBatch,
} from "@angular/fire/firestore";
import { mergeMap, Observable } from "rxjs";

import {
    Group,
    GroupCode,
    isExpired,
    MemberRole,
    toFirestore,
    UpsertGroup,
} from "../../models/group.model";
import { generateRandomNumber } from "../../utilities/common";
import { ErrorCode } from "../../utilities/error-codes";
import { throwIfNotFound } from "../../utilities/firebase-errors";
import { maxBy } from "lodash-es";

export const GROUP_COLLECTION_NAME = "groups";
const GROUP_CODE_COLLECTION_NAME = "group_code";
const BATCH_DELETE_LIMIT = 450;
const CODE_GENERATION_ATTEMPTS = 5;

@Injectable({
    providedIn: "root",
})
export class GroupService {
    private readonly firestore = inject(Firestore);

    query$(
        userId: string,
    ): Observable<{ type: "added" | "removed" | "modified"; group: Group }> {
        const ref = collection(this.firestore, GROUP_COLLECTION_NAME);
        const q = query(ref, where("memberIds", "array-contains", userId));

        return collectionChanges(q).pipe(
            mergeMap((changeDocs) =>
                changeDocs.map((changeDoc) => ({
                    type: changeDoc.type as "added" | "removed" | "modified",
                    group: {
                        ...changeDoc.doc.data(),
                        id: changeDoc.doc.id,
                    } as Group,
                })),
            ),
        );
    }

    async create(group: Group): Promise<string> {
        const ref = collection(this.firestore, GROUP_COLLECTION_NAME);
        const sanpshot = await addDoc(ref, {
            ...group,
            modifiedAt: Timestamp.fromDate(new Date()),
        } as Group);
        return sanpshot.id;
    }

    update(id: string, group: UpsertGroup): Promise<void> {
        const ref = doc(this.firestore, GROUP_COLLECTION_NAME, id);
        return updateDoc(ref, {
            ...group,
            modifiedAt: Timestamp.fromDate(new Date()),
        });
    }

    updateRole(
        id: string,
        memberId: string,
        roleToUpdate: MemberRole,
    ): Promise<void> {
        const ref = doc(this.firestore, GROUP_COLLECTION_NAME, id);
        return updateDoc(ref, { [`members.${memberId}.role`]: roleToUpdate });
    }

    async removeMember(id: string, memberId: string): Promise<void> {
        const ref = doc(this.firestore, GROUP_COLLECTION_NAME, id);
        const sanapshot = await getDoc(ref);
        const group = throwIfNotFound(sanapshot).data() as Group;
        const member = group.memberIds.find((id) => id === memberId);
        if (!member) {
            throw ErrorCode.USER_DOESNOT_BELONG_TO_GROUP;
        } else if (
            group.members[member].role === MemberRole.admin &&
            Object.values(group.members).filter(
                (m) => m.role === MemberRole.admin,
            ).length === 1
        ) {
            throw ErrorCode.NO_OTHER_ADMIN_FOUND;
        }

        return updateDoc(ref, { memberIds: arrayRemove(memberId) });
    }

    async delete(userId: string, id: string): Promise<void> {
        const ref = doc(this.firestore, GROUP_COLLECTION_NAME, id);
        const snapshot = await getDoc(ref);
        const group = throwIfNotFound(snapshot).data() as Group;
        if (!this.isCurrentUserAuthorizedToUpdate(userId, group)) {
            throw ErrorCode.INVALID_PERMISSION;
        }

        const expensesRef = collection(
            this.firestore,
            GROUP_COLLECTION_NAME,
            id,
            "expenses",
        );
        const expenseDocs = await getDocs(expensesRef);

        const refsToDelete = [
            doc(this.firestore, GROUP_CODE_COLLECTION_NAME, id),
            ...expenseDocs.docs.map((expenseDoc) => expenseDoc.ref),
            ref,
        ];

        for (let i = 0; i < refsToDelete.length; i += BATCH_DELETE_LIMIT) {
            const batch = writeBatch(this.firestore);
            refsToDelete
                .slice(i, i + BATCH_DELETE_LIMIT)
                .forEach((docRef) => batch.delete(docRef));
            await batch.commit();
        }
    }

    getCode(groupId: string): Promise<number> {
        const collectionRef = collection(
            this.firestore,
            GROUP_CODE_COLLECTION_NAME,
        );
        return runTransaction(this.firestore, async (transaction) => {
            const groupDoc = await transaction.get(doc(collectionRef, groupId));
            if (!groupDoc.exists() || isExpired(groupDoc.data() as GroupCode)) {
                const newCode = await this.generateUniqueCode(collectionRef);
                transaction.set(
                    doc(collectionRef, groupId),
                    toFirestore(newCode),
                );
                return newCode;
            }

            return (groupDoc.data() as GroupCode).code;
        });
    }

    private async generateUniqueCode(
        collectionRef: CollectionReference,
    ): Promise<number> {
        for (let attempt = 0; attempt < CODE_GENERATION_ATTEMPTS; attempt++) {
            const candidate = generateRandomNumber();
            const existing = await getDocs(
                query(collectionRef, where("code", "==", candidate), limit(1)),
            );
            if (existing.empty) {
                return candidate;
            }
        }

        throw ErrorCode.CODE_GENERATION_FAILED;
    }

    async addMemeberToGroupViaCode(
        userId: string,
        name: string,
        code: number,
    ): Promise<string> {
        const ref = collection(this.firestore, GROUP_CODE_COLLECTION_NAME);
        const q = query(ref, where("code", "==", code), limit(1));

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            throw "Invalid code";
        }

        const groupCodeDoc = querySnapshot.docs[0];
        const groupCode = groupCodeDoc.data() as GroupCode;
        if (isExpired(groupCode)) {
            throw "Code expired.";
        } else if (+groupCode.code !== code) {
            throw "Invalide code";
        }

        return this.addMemberToGroup(groupCodeDoc.id, userId, name);
    }

    async addMemberToGroup(
        groupId: string,
        userId: string,
        name: string,
        isVirtual: boolean = false,
    ): Promise<string> {
        const groupRef = doc(this.firestore, GROUP_COLLECTION_NAME, groupId);
        const groupSnapshot = await getDoc(groupRef);
        const group = throwIfNotFound(groupSnapshot).data() as Group;
        const existingMemberId = group.memberIds.find((id) => id === userId);
        if (!existingMemberId) {
            const update: UpdateData<Group> = {
                memberIds: arrayUnion(userId),
            };

            if (!group.members[userId]) {
                update[`members.${userId}`] = {
                    id: userId,
                    name,
                    paid: 0,
                    share: 0,
                    isVirtual,
                };
            } else {
                update[`members.${userId}.role`] = MemberRole.user;
            }

            await updateDoc(groupRef, update);
        }

        return group.id;
    }

    async addCategoryToGroup(
        groupId: string,
        subCategoryName: string,
        icon: string,
        categoryId?: number,
        categoryName?: string,
    ): Promise<string> {
        const groupRef = doc(this.firestore, GROUP_COLLECTION_NAME, groupId);
        const groupSnapshot = await getDoc(groupRef);
        const group = throwIfNotFound(groupSnapshot).data() as Group;
        group.categories ??= [];
        const subCategoryToAdd = {
            id:
                (maxBy(
                    group.categories.flatMap((cat) => cat.subCategories),
                    (cat) => cat.id,
                )?.id ?? 0) + 1,
            name: subCategoryName,
            icon,
        };

        if (!categoryId) {
            if (!categoryName) {
                throw "Category name is required";
            }

            group.categories.push({
                id: (maxBy(group.categories, (cat) => cat.id)?.id ?? 0) + 1,
                name: categoryName,
                subCategories: [subCategoryToAdd],
            });
        } else {
            const existingCategory = group.categories.find(
                (c) => c.id === categoryId,
            );
            existingCategory?.subCategories.push(subCategoryToAdd);
        }

        await updateDoc(groupRef, { categories: group.categories });

        return group.id;
    }

    private isCurrentUserAuthorizedToUpdate(
        userId: string | null,
        group: Group,
    ) {
        const currentMemberId = group.memberIds.find((id) => id === userId);
        if (
            !currentMemberId ||
            group.members[currentMemberId].role !== MemberRole.admin
        ) {
            throw "User is not authorised to perform this action";
        }

        return true;
    }
}
