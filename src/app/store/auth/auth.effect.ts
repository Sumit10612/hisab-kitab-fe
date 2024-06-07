import { Injectable, inject } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";

import { map, mergeMap, switchMap, tap } from "rxjs";
import { NotificationService } from "../../services/notification.service";
import { AuthActions } from "./auth.action";
import { NavigationService } from "../../services/navigation.service";
import { UserActions } from "../user/user.action";
import { AuthService } from "../../services/auth.service";
import { AppActions } from "../app.action";

@Injectable()
export class AuthEffects {
	private readonly actions$ = inject(Actions);
	private readonly authService = inject(AuthService);
	private readonly notification = inject(NotificationService);
	private readonly navigation = inject(NavigationService);

	login$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(AuthActions.login),
			tap(() => this.notification.showLoading()),
			switchMap(({ email, password }) => this.authService.login(email, password)
				.then(
					() => AuthActions.loginSuccess(),
					error => AuthActions.loginFailure({ error })
				)
				.finally(() => this.notification.hideLoading())
			)
		)
	});

	loginWithGoogle$ = createEffect(() =>
		this.actions$.pipe(
			ofType(AuthActions.loginWithGoogle),
			tap(() => this.notification.showLoading()),
			switchMap(() => this.authService.googleSignIn()
				.then(
					user => user === null ? AuthActions.loginSuccess() : AuthActions.saveUserProfile({ user }),
					error => AuthActions.loginFailure({ error })
				)
				.finally(() => this.notification.hideLoading())
			)
		)
	);

	signup$ = createEffect(() =>
		this.actions$.pipe(
			ofType(AuthActions.signup),
			tap(() => this.notification.showLoading()),
			switchMap(({ email, password, name }) => this.authService.signUp(email, password)
				.then(
					userCredential => {
						const { user: { uid } } = userCredential;
						return AuthActions.saveUserProfile({ user: { uid, email, name } });
					},
					error => AuthActions.signupFailure({ error })
				)
				.finally(() => this.notification.hideLoading())
			)
		)
	);

	saveUserProfile$ = createEffect(() =>
		this.actions$.pipe(
			ofType(AuthActions.saveUserProfile),
			map(({ user }) => UserActions.add({ user }))
		)
	);

	loginSuccess$ = createEffect(() =>
		this.actions$.pipe(
			ofType(AuthActions.loginSuccess),
			map(() => AppActions.init()),
			tap(() => this.navigation.navigateToHome())
		)
	);

	logout$ = createEffect(() => {
		return this.actions$.pipe(
			ofType(AuthActions.logout),
			tap(() => this.notification.showLoading()),
			mergeMap(() => this.authService.logout()
				.then(
					() => AuthActions.logoutSuccess(),
					error => AuthActions.logoutFailure({ error })
				)
			)
		);
	});

	logoutSuccess$ = createEffect(() =>
		this.actions$.pipe(
			ofType(AuthActions.logoutSuccess),
			tap(() => {
				window.location.reload();
				this.navigation.navigateToLogin();
			})
		),
		{ dispatch: false }
	);

	resetPassword$ = createEffect(() =>
		this.actions$.pipe(
			ofType(AuthActions.resetPassword),
			switchMap(({ email }) => this.authService.passwordReset(email)
				.then(() => AuthActions.resetPasswordSuccess())
			)
		)
	);
}