import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType, ROOT_EFFECTS_INIT } from "@ngrx/effects";
import { map, switchMap, tap } from "rxjs";

import { NotificationService } from "../services/notification.service";

import { AppActions } from "./app.action";
import { AuthActions } from "./auth/auth.action";
import { GroupAction } from "./group/group.action";
import { UserActions } from "./user/user.action";
import { AuthService } from "./auth/auth.service";

@Injectable()
export class AppEffects {
	private readonly actions$ = inject(Actions);
	private readonly authService = inject(AuthService);
	private readonly notification = inject(NotificationService);

	initApp$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(ROOT_EFFECTS_INIT, AuthActions.loginSuccess),
			switchMap(() => this.authService.user$.pipe(
				map(user => AppActions.initialized({ loggedInUserId: user.uid }))
			))
		);
	});

	getUser$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(AppActions.initialized),
			map(({ loggedInUserId }) => UserActions.get({ id: loggedInUserId }))
		);
	});

	myGroups$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(AppActions.initialized),
			map(({ loggedInUserId }) => GroupAction.query({ userId: loggedInUserId }))
		);
	});

	handleError$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(AppActions.handleError),
			tap(({ error }) => this.notification.firebaseError(error))
		);
	}, { dispatch: false });
}