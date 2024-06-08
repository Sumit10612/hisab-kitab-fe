import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { filter, finalize, map, of, switchMap, take, tap } from "rxjs";

import { GroupService } from "../../services/group.service";
import { NotificationService } from "../../services/notification.service";

import { GroupAction } from "./group.action";
import { Store } from "@ngrx/store";
import { UserActions } from "../user/user.action";
import { UserSelector } from "../user/user.selector";
import { NavigationService } from "../../services/navigation.service";
import { Group } from "../../models/group.model";

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
						members: [{
							id: user.uid,
							name: user.name,
							role: "admin",
							active: true,
						}]
					} as Group;

					return this.groupService.create(group, user).then(
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
					if (user?.groupIds?.length && user.groups?.length) {
						return this.groupService.getGroups$(user.groupIds, user.groups).pipe(
							map(groups => {
								this.notification.hideLoading();
								return GroupAction.getAllSuccess({
									groups: groups.map(group => {
										const members = group.members
											.map(m => m.id === user.uid ? { ...m, name: "You" } : m);
										return {
											...group,
											members
										}
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
}