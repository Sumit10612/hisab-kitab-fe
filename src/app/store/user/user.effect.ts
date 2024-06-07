import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import {
	catchError,
	map,
	of,
	switchMap,
	tap
} from "rxjs";

import { NotificationService } from "../../services/notification.service";
import { UserService } from "../../services/user.service";

import { UserActions } from "./user.action";
import { NavigationService } from "../../services/navigation.service";

@Injectable()
export class UserEffects {
	private readonly actions$ = inject(Actions);
	private readonly userService = inject(UserService);
	private readonly notification = inject(NotificationService);
	private readonly navigation = inject(NavigationService);

	add$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(UserActions.add),
			tap(() => this.notification.showLoading()),
			switchMap(({ user }) => this.userService.add(user)
				.then(() => UserActions.addSuccess())
				.finally(() => this.notification.hideLoading())
			)
		);
	});

	addSuccess$ = createEffect(() =>
		this.actions$.pipe(
			ofType(UserActions.addSuccess),
			tap(() => this.navigation.navigateToHome())
		),
		{ dispatch: false }
	);

	get$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(UserActions.get),
			switchMap(({ id }) => this.userService.get(id).then(
				user => UserActions.getSuccess({ user }),
				() => UserActions.getFail()
			))
		);
	});

	update$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(UserActions.update),
			tap(() => this.notification.showLoading()),
			switchMap(({ user }) => this.userService.update(user)
				.then(() => UserActions.updateSuccess({ user }))
				.finally(() => this.notification.hideLoading())
			)
		);
	});
}