import { computed, inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import {
	pick,
	random,
	round,
	sample,
	times,
	values
} from "lodash-es";
import {
	map,
	mergeMap,
	switchMap,
	tap
} from "rxjs";

import { DEFAULT_CATEGORY } from "../../models/category.model";
import { Group, GroupInfo, GroupType, MemberRole } from "../../models/group.model";
import { NavigationService } from "../../services/navigation.service";
import { NotificationService } from "../../services/notification.service";
import { ErrorCode } from "../../utilities/error-codes";
import { AppActions } from "../app.action";
import { UserSelector } from "../user/user.selector";

import { GroupAction } from "./group.action";
import { GroupService } from "./group.service";

@Injectable()
export class GroupEffects {
	private readonly action$ = inject(Actions);
	private readonly groupService = inject(GroupService);
	private readonly notification = inject(NotificationService);
	private readonly navigation = inject(NavigationService);
	private readonly store = inject(Store);

	private readonly $user = computed(() => {
		const user = this.store.selectSignal(UserSelector.select)();
		if(!user) {
			throw new Error("User not found");
		}

		return user;
	});

	query$ = createEffect(() => {
		return this.action$.pipe(
			ofType(GroupAction.query),
			mergeMap(({ userId }) => this.groupService.query$(userId).pipe(
				map(changeDoc => {
					const members = Object.fromEntries(
						Object.entries(changeDoc.group.members).map(([id, member]) => [
							id,
							{ ...member, name: member.id === userId ? "You" : member.name }
						])
					);
					const group = {
						...changeDoc.group,
						groupTotal: round(changeDoc.group.groupTotal, 2),
						monthTotal: Object.fromEntries(
							Object.entries(changeDoc.group.monthTotal).map(([key, value]) => [key, round(value, 2)])
						),
						members,
						currentMember:  members[userId],
						isCurrentMemberIsAdmin:  members[userId].role === MemberRole.admin,
						activeMembers: values(pick(members, changeDoc.group.memberIds))
					} as GroupInfo;

					if(group.groupType === GroupType.SpiltExpense) {
						const you = values(group.members).find(member => member.id === userId);
						group.groupTotal = round((you?.paid ?? 0) - (you?.share ?? 0));
					}

					switch (changeDoc.type) {
						case "added": return GroupAction.added({ group });
						case "modified": return GroupAction.modified({ group });
						case "removed": return GroupAction.removed({ id: group.id });
					}
				})
			))
		);
	});

	create$ = createEffect(() => {
		return this.action$.pipe(
			ofType(GroupAction.create),
			switchMap(async ({ upsertGroup }) => {
				this.notification.showLoading();
				try {
					await this.groupService.create({
						...upsertGroup,
						groupTotal: 0,
						monthTotal: {},
						memberIds: [this.$user().uid],
						members: {
							[this.$user().uid]: {
								id: this.$user().uid,
								name: this.$user().name,
								role: MemberRole.admin,
								paid: 0,
								share: 0,
								isVirtual: false
							}
						},
						categories: [DEFAULT_CATEGORY]
					} as Group);
					
					return GroupAction.createSuccess();
				} catch (error) {
					return AppActions.handleError({ error });
				} finally {
					this.notification.hideLoading();
				}
			})
		);
	});

	update$ = createEffect(() => {
		return this.action$.pipe(
			ofType(GroupAction.update),
			switchMap(async ({ id, upsertGroup }) => {
				this.notification.showLoading();
				try {
					await this.groupService.update(id, upsertGroup);
					return GroupAction.updateSuccess();
				} catch (error) {
					return AppActions.handleError({ error });
				} finally {
					this.notification.hideLoading();
				}
			})
		);
	});

	updateRole$ = createEffect(() => {
		return this.action$.pipe(
			ofType(GroupAction.updateRole),
			switchMap(async ({ id, memberId, role }) => {
				this.notification.showLoading();
				try {
					await this.groupService.updateRole(id, memberId, role);
					return GroupAction.updateSuccess();
				} catch (error) {
					return AppActions.handleError({ error });
				} finally {
					this.notification.hideLoading();
				}
			})
		);
	});

	delete$ = createEffect(() => {
		return this.action$.pipe(
			ofType(GroupAction.deleteGroup),
			switchMap(async ({ id }) => {
				this.notification.showLoading();
				try {
					await this.groupService.delete(this.$user().uid, id);
					return GroupAction.deleteSuccess();
				} catch (error) {
					return AppActions.handleError({ error });
				} finally {
					this.notification.hideLoading();
				}
			})
		);
	});

	getCode$ = createEffect(() => {
		return this.action$.pipe(
			ofType(GroupAction.getCode),
			switchMap(async ({ id }) => {
				this.notification.showLoading();
				try {
					const code = await this.groupService.getCode(id);
					return GroupAction.getCodeSuccess({ id, code });
				} catch (error) {
					return AppActions.handleError({ error });
				} finally {
					this.notification.hideLoading();
				}
			})
		);
	});

	addMember$ = createEffect(() => {
		return this.action$.pipe(
			ofType(GroupAction.addMember),
			switchMap(async ({ code }) => {
				this.notification.showLoading();
				try {
					await this.groupService.addMemeberToGroupViaCode(this.$user().uid, this.$user().name ?? "", code);
					return GroupAction.addMemberSuccess();
				} catch (error) {
					return AppActions.handleError({ error });
				} finally {
					this.notification.hideLoading();
				}
			})
		);
	});

	addVirtualMember$ = createEffect(() => {
		return this.action$.pipe(
			ofType(GroupAction.addVirtualMember),
			switchMap(async ({ groupId, name }) => {
				this.notification.showLoading();
				try {
					const segment = () => random(0, 15).toString(16);
					const uid = `${times(8, segment).join("")}-${times(4, segment).join("")}-4${times(3, segment).join("")}-${sample(["8", "9", "a", "b"])}${times(3, segment).join("")}-${times(12, segment).join("")}`;
					await this.groupService.addMemberToGroup(groupId, uid, name, true);
					return GroupAction.addMemberSuccess();
				} catch (error) {
					return AppActions.handleError({ error });
				} finally {
					this.notification.hideLoading();
				}
			})
		);
	});

	navigateHome$ = createEffect(() => {
		return this.action$.pipe(
			ofType(GroupAction.createSuccess, GroupAction.deleteSuccess, GroupAction.addMemberSuccess),
			tap(() => this.navigation.navigateToHome())
		);
	}, { dispatch: false });

	removeMember$ = createEffect(() => {
		return this.action$.pipe(
			ofType(GroupAction.removeMember),
			switchMap(async ({ id, memberId }) => {
				try {
					this.notification.showLoading();
					await this.groupService.removeMember(id, memberId ?? this.$user().uid);
					return GroupAction.removeMemberSuccess({ memberId });
				} catch (error) {
					if (error === ErrorCode.NO_OTHER_ADMIN_FOUND) {
						this.notification.error("Cannot leave, you are the only admin here.");
					}

					return AppActions.handleError({ error });
				} finally {
					this.notification.hideLoading();
				}
			})
		);
	});

	removeMemberSuccess$ = createEffect(() => {
		return this.action$.pipe(
			ofType(GroupAction.removeMemberSuccess),
			tap(({ memberId }) => {
				if (!memberId) {
					this.navigation.navigateToHome();
				}
			})
		);
	}, { dispatch: false });

	addCategory$ = createEffect(() => {
		return this.action$.pipe(
			ofType(GroupAction.addCategory),
			switchMap(async ({ groupId, subCategoryName, icon, categoryId, categoryName }) => {
				this.notification.showLoading();
				try {
					await this.groupService.addCategoryToGroup(groupId, subCategoryName, icon, categoryId, categoryName);
					return GroupAction.addCategorySuccess();
				} catch (error) {
					return AppActions.handleError({ error });
				} finally {
					this.notification.hideLoading();
				}
			})
		);
	});
}