import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { catchError, filter, finalize, map, of, switchMap, take, tap } from "rxjs";

import { GroupService } from "../../services/group.service";
import { NotificationService } from "../../services/notification.service";

import { GroupAction } from "./group.action";
import { Store } from "@ngrx/store";
import { UserActions } from "../user/user.action";
import { UserSelector } from "../user/user.selector";
import { NavigationService } from "../../services/navigation.service";
import { Group } from "../../models/group.model";
import { ErrorCode } from "../../utilities/error-codes";

@Injectable()
export class GroupEffects {
	private readonly action$ = inject(Actions);
	private readonly groupService = inject(GroupService);
	private readonly notification = inject(NotificationService);
	private readonly navigation = inject(NavigationService);
	private readonly store = inject(Store);

	create$ = createEffect(() =>
		this.action$.pipe(
			ofType(GroupAction.create),
			tap(() => this.notification.showLoading()),
			switchMap(({ upsertGroup }) => this.store.select(UserSelector.select).pipe(
				take(1),
				switchMap(user => {
					if (!user) {
						return of(GroupAction.createFail());
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
								role: "admin",
							}
						}
					} as Group;

					return this.groupService.create(group).then(
						id => GroupAction.createSuccess({ group: { ...group, id } }),
						error => GroupAction.createFail()
					)
				}),
				finalize(() => this.notification.hideLoading())
			))
		)
	);

	createSuccess$ = createEffect(() =>
		this.action$.pipe(
			ofType(GroupAction.createSuccess),
			tap(() => this.navigation.navigateToHome())
		),
		{ dispatch: false }
	);

	getAll$ = createEffect(() =>
		this.action$.pipe(
			ofType(GroupAction.getAll),
			tap(() => this.notification.showLoading()),
			switchMap(() => this.store.select(UserSelector.select).pipe(
				filter(user => !!user),
				take(1),
				switchMap(user => {
					if (user?.uid) {
						return this.groupService.getGroups$(user.uid).pipe(
							map(groups => {
								this.notification.hideLoading();
								return GroupAction.getAllSuccess({
									groups: groups.map(group => {
										return {
											...group,
											members: Object.fromEntries(
												Object.entries(group.members).map(([id, member]) => [
													id,
													{ ...member, name: member.id === user.uid ? "You" : member.name }
												])
											)
										};
									})
								});
							})
						)
					}

					return of(GroupAction.getAllSuccess({ groups: [] }));
				})
			))
		)
	);

	get$ = createEffect(() =>
		this.action$.pipe(
			ofType(GroupAction.get),
			tap(() => this.notification.showLoading()),
			switchMap(({ id }) => this.groupService.get(id).then(
				group => GroupAction.getSuccess({ group })
			)),
			finalize(() => this.notification.hideLoading())
		)
	);

	update$ = createEffect(() =>
		this.action$.pipe(
			ofType(GroupAction.update),
			tap(() => this.notification.showLoading()),
			switchMap(({ id, upsertGroup }) => this.groupService.update(id, upsertGroup)
				.then(
					() => GroupAction.updateSuccess({ id, upsertGroup }),
					error => GroupAction.updateFail()
				)
				.finally(() => this.notification.hideLoading())
			)
		)
	);

	updateRole$ = createEffect(() =>
		this.action$.pipe(
			ofType(GroupAction.updateRole),
			tap(() => this.notification.showLoading()),
			switchMap(async ({ id, memberId, role }) => {
				await this.groupService.updateRole(id, memberId, role);
				return GroupAction.updateRoleSuccess({ id });
			}),
			catchError(() => of(GroupAction.updateRoleFail())),
			finalize(() => this.notification.hideLoading())
		)
	);

	reorderGroups$ = createEffect(() => {
		return this.action$.pipe(
			ofType(GroupAction.reorderGroups),
			switchMap(({ reorderedGroups }) => this.store.select(UserSelector.select).pipe(
				take(1),
				map(user => {
					if (user) {
						return UserActions.update({ user: { ...user, groups: reorderedGroups } });
					}

					return GroupAction.reorderGroupsFail();
				})
			))
		)
	});

	delete$ = createEffect(() =>
		this.action$.pipe(
			ofType(GroupAction.deleteGroup),
			tap(() => this.notification.showLoading()),
			switchMap(({ id }) => this.store.select(UserSelector.select).pipe(
				take(1),
				switchMap(user => {
					if (!user?.uid) {
						return of(GroupAction.deleteFail());
					}

					return this.groupService.delete(user.uid, id).then(
						() => GroupAction.deleteSuccess({ id }),
						error => GroupAction.deleteFail()
					)
				})
			)),
			finalize(() => this.notification.hideLoading())
		)
	);

	deleteSuccess$ = createEffect(() =>
		this.action$.pipe(
			ofType(GroupAction.deleteSuccess),
			tap(() => this.navigation.navigateToHome())
		),
		{ dispatch: false }
	);

	getCode$ = createEffect(() =>
		this.action$.pipe(
			ofType(GroupAction.getCode),
			tap(() => this.notification.showLoading()),
			switchMap(({ id }) => this.groupService.getCode(id)
				.then(
					(code) => GroupAction.getCodeSuccess({ id, code }),
					error => GroupAction.getCodeFail()
				)
				.finally(() => this.notification.hideLoading())
			)
		)
	);

	addMember$ = createEffect(() =>
		this.action$.pipe(
			ofType(GroupAction.addMember),
			tap(() => this.notification.showLoading()),
			switchMap(({ code }) => this.store.select(UserSelector.select).pipe(
				take(1),
				switchMap(async user => {
					if (!user) {
						return GroupAction.addMemberFail();
					}

					const groupId = await this.groupService.addMemeberToGroup(user.uid, user.name ?? '', code);
					return GroupAction.addMemberSuccess({ id: groupId });
				}),
				catchError((error) => {
					this.notification.error(error);
					return of(GroupAction.addMemberFail());
				}),
				finalize(() => this.notification.hideLoading())
			))
		)
	);

	addMemberSuccess$ = createEffect(() =>
		this.action$.pipe(
			ofType(GroupAction.addMemberSuccess),
			tap(() => this.navigation.navigateToHome())
		),
		{ dispatch: false }
	);

	removeMember$ = createEffect(() =>
		this.action$.pipe(
			ofType(GroupAction.removeMember),
			tap(() => this.notification.showLoading()),
			switchMap(({ id, memberId }) => this.store.select(UserSelector.select).pipe(
				take(1),
				switchMap(async user => {
					if (!user) {
						return GroupAction.removeMemberFail();
					}

					await this.groupService.removeMember(id, memberId ?? user.uid);
					return GroupAction.removeMemberSuccess({ id, memberId });
				}),
				catchError((error) => {
					if (error === ErrorCode.NO_OTHER_ADMIN_FOUND) {
						this.notification.error("Cannot leave, you are the only admin here.");
					}
					return of(GroupAction.removeMemberFail());
				}),
				finalize(() => this.notification.hideLoading())
			))
		)
	);

	removeMemberSuccess$ = createEffect(() =>
		this.action$.pipe(
			ofType(GroupAction.removeMemberSuccess),
			tap(({ memberId }) => {
				if(!memberId) {
					this.navigation.navigateToHome();
				}
			})
		),
		{ dispatch: false }
	);
}