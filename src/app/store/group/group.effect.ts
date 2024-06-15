import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { Store } from "@ngrx/store";
import { round } from "lodash-es";
import {
	map,
	mergeMap,
	switchMap,
	take,
	tap
} from "rxjs";

import { Group, MemberRole } from "../../models/group.model";
import { GroupService } from "../../services/group.service";
import { NavigationService } from "../../services/navigation.service";
import { NotificationService } from "../../services/notification.service";
import { ErrorCode } from "../../utilities/error-codes";
import { AppActions } from "../app.action";
import { UserSelector } from "../user/user.selector";

import { GroupAction } from "./group.action";

@Injectable()
export class GroupEffects {
	private readonly action$ = inject(Actions);
	private readonly groupService = inject(GroupService);
	private readonly notification = inject(NotificationService);
	private readonly navigation = inject(NavigationService);
	private readonly store = inject(Store);

	query$ = createEffect(() => {
		return this.action$.pipe(
			ofType(GroupAction.query),
			mergeMap(({ userId }) => this.groupService.query$(userId).pipe(
				map(changeDoc => {
					const group = {
						...changeDoc.group,
						groupTotal: round(changeDoc.group.groupTotal, 2),
						monthTotal: Object.fromEntries(
							Object.entries(changeDoc.group.monthTotal).map(([key, value]) => [key, round(value, 2)])
						),
						members: Object.fromEntries(
							Object.entries(changeDoc.group.members).map(([id, member]) => [
								id,
								{ ...member, name: member.id === userId ? "You" : member.name }
							])
						)
					} as Group;

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
			switchMap(({ upsertGroup }) => this.store.select(UserSelector.select).pipe(
				take(1),
				switchMap(async user => {
					this.notification.showLoading();
					try {
						if (!user) {
							throw ErrorCode.NOT_FOUND;
						}

						const group = {
							...upsertGroup,
							groupTotal: 0,
							monthTotal: {},
							memberIds: [user.uid],
							members: {
								[user.uid]: {
									id: user.uid,
									name: user.name,
									role: MemberRole.admin,
								}
							}
						} as Group;

						await this.groupService.create(group);
						return GroupAction.createSuccess();
					} catch (error) {
						return AppActions.handleError({ error });
					} finally {
						this.notification.hideLoading();
					}
				})
			))
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
			switchMap(({ id }) => this.store.select(UserSelector.select).pipe(
				take(1),
				switchMap(async user => {
					this.notification.showLoading();
					try {
						if (!user?.uid) {
							throw ErrorCode.NOT_FOUND;
						}

						await this.groupService.delete(user.uid, id);
						return GroupAction.deleteSuccess();
					} catch (error) {
						return AppActions.handleError({ error });
					} finally {
						this.notification.hideLoading();
					}
				})
			))
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
			switchMap(({ code }) => this.store.select(UserSelector.select).pipe(
				take(1),
				switchMap(async user => {
					this.notification.showLoading();
					try {
						if (!user) {
							throw ErrorCode.NOT_FOUND;
						}

						await this.groupService.addMemeberToGroup(user.uid, user.name ?? "", code);
						return GroupAction.addMemberSuccess();
					} catch (error) {
						return AppActions.handleError({ error });
					} finally {
						this.notification.hideLoading();
					}
				})
			))
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
			switchMap(({ id, memberId }) => this.store.select(UserSelector.select).pipe(
				take(1),
				switchMap(async user => {
					try {
						if (!user) {
							throw ErrorCode.NOT_FOUND;
						}

						await this.groupService.removeMember(id, memberId ?? user.uid);
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
			))
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
}