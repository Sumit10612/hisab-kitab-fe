import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import {
	catchError,
	finalize,
	map,
	of,
	switchMap,
	tap
} from "rxjs";

import { NotificationService } from "../../services/notification.service";
import { UserService } from "../../services/user.service";

import { UserAction } from "./user.action";

@Injectable()
export class UserEffects {
	private readonly actions$ = inject(Actions);
	private readonly userService = inject(UserService);
	private readonly notification = inject(NotificationService);

	get$ = createEffect(() => { return this.actions$.pipe(
		ofType(UserAction.get),
		switchMap(() => this.userService.get$.pipe(
			map(user => UserAction.getSuccess({ user })),
			catchError(() => of(UserAction.getFail()))
		))
	); });

	update$ = createEffect(() => { return this.actions$.pipe(
		ofType(UserAction.update),
		tap(() => this.notification.showLoading()),
		switchMap(({ user }) => this.userService.update$(user).pipe(
			finalize(() => this.notification.hideLoading()),
			map(() => UserAction.updateSuccess())
		))
	); });
}