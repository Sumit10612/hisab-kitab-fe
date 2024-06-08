import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { filter, map, of, switchMap, take, tap } from "rxjs";

import { GroupService } from "../../services/group.service";
import { NotificationService } from "../../services/notification.service";

import { GroupAction } from "./group.action";
import { Store } from "@ngrx/store";
import { UserActions } from "../user/user.action";
import { UserSelector } from "../user/user.selector";

@Injectable()
export class GroupEffects {
	private readonly action$ = inject(Actions);
	private readonly groupService = inject(GroupService);
	private readonly notification = inject(NotificationService);
	private readonly store = inject(Store);

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
								return GroupAction.getAllSuccess({ groups });
							})
						)
					}

					return of(GroupAction.getAllSuccess({ groups: [] }));
				})
			))
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