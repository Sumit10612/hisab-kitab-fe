import { inject, Injectable } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { map, mergeMap, switchMap, tap } from "rxjs";

import { NavigationService } from "../../services/navigation.service";
import { NotificationService } from "../../services/notification.service";
import { AppActions } from "../app.action";
import { UserActions } from "../user/user.action";

import { AuthActions } from "./auth.action";
import { AuthService } from "./auth.service";

@Injectable()
export class AuthEffects {
    private readonly actions$ = inject(Actions);
    private readonly authService = inject(AuthService);
    private readonly notification = inject(NotificationService);
    private readonly navigation = inject(NavigationService);

    login$ = createEffect(() => {
        return this.actions$.pipe(
            ofType(AuthActions.login),
            switchMap(async ({ email, password }) => {
                try {
                    this.notification.showLoading();
                    await this.authService.login(email, password);
                    return AuthActions.loginSuccess();
                } catch (error) {
                    return AppActions.handleError({ error });
                } finally {
                    this.notification.hideLoading();
                }
            }),
        );
    });

    loginWithGoogle$ = createEffect(() => {
        return this.actions$.pipe(
            ofType(AuthActions.loginWithGoogle),
            switchMap(async () => {
                try {
                    this.notification.showLoading();
                    const user = await this.authService.googleSignIn();
                    if (user) {
                        return AuthActions.saveUserProfile({ user });
                    }
                    return AuthActions.loginSuccess();
                } catch (error) {
                    return AppActions.handleError({ error });
                } finally {
                    this.notification.hideLoading();
                }
            }),
        );
    });

    signup$ = createEffect(() => {
        return this.actions$.pipe(
            ofType(AuthActions.signup),
            tap(() => this.notification.showLoading()),
            switchMap(async ({ email, password, name }) => {
                this.notification.showLoading();
                try {
                    const {
                        user: { uid },
                    } = await this.authService.signUp(email, password);
                    return AuthActions.saveUserProfile({
                        user: { uid, email, name },
                    });
                } catch (error) {
                    return AppActions.handleError({ error });
                } finally {
                    this.notification.hideLoading();
                }
            }),
        );
    });

    saveUserProfile$ = createEffect(() => {
        return this.actions$.pipe(
            ofType(AuthActions.saveUserProfile),
            map(({ user }) => UserActions.add({ user })),
        );
    });

    loginSuccess$ = createEffect(
        () => {
            return this.actions$.pipe(
                ofType(AuthActions.loginSuccess),
                tap(() => this.navigation.navigateToHome()),
            );
        },
        { dispatch: false },
    );

    logout$ = createEffect(() => {
        return this.actions$.pipe(
            ofType(AuthActions.logout),
            tap(() => this.notification.showLoading()),
            mergeMap(async () => {
                this.notification.showLoading();
                try {
                    await this.authService.logout();
                    return AuthActions.logoutSuccess();
                } catch (error) {
                    return AppActions.handleError({ error });
                } finally {
                    this.notification.hideLoading();
                }
            }),
        );
    });

    logoutSuccess$ = createEffect(
        () => {
            return this.actions$.pipe(
                ofType(AuthActions.logoutSuccess),
                tap(() => {
                    window.location.reload();
                    this.navigation.navigateToLogin();
                }),
            );
        },
        { dispatch: false },
    );

    resetPassword$ = createEffect(() => {
        return this.actions$.pipe(
            ofType(AuthActions.resetPassword),
            switchMap(async ({ email }) => {
                this.notification.showLoading();
                try {
                    await this.authService.passwordReset(email);
                    return AuthActions.resetPasswordSuccess();
                } catch (error) {
                    return AppActions.handleError({ error });
                } finally {
                    this.notification.hideLoading();
                }
            }),
        );
    });
}
