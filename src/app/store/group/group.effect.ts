import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { map, switchMap, tap } from "rxjs";

import { GroupService } from "../../services/group.service";
import { NotificationService } from "../../services/notification.service";

import { GroupAction } from "./group.action";

@Injectable()
export class GroupEffects {
	private readonly action$ = inject(Actions);
	private readonly groupService = inject(GroupService);
	private readonly notification = inject(NotificationService);

	getAll$ = createEffect(() => { return this.action$.pipe(
		ofType(GroupAction.getAll),
		tap(() => this.notification.showLoading()),
		switchMap(({ ids, groups }) => this.groupService.getGroups$(ids, groups).pipe(
			map((groups) => {
				this.notification.hideLoading();
				return GroupAction.getAllSuccess({ groups });
			})
		))
	); });
}