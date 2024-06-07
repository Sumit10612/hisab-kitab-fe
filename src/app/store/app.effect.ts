import { Injectable, inject } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { AppActions } from "./app.action";
import { map, switchMap, tap } from "rxjs";
import { AuthService } from "../services/auth.service";
import { UserActions } from "./user/user.action";
import { NavigationService } from "../services/navigation.service";

@Injectable()
export class AppEffects {
	private readonly actions$ = inject(Actions);
	private readonly authService = inject(AuthService);
	private readonly navigation = inject(NavigationService);

	initApp$ = createEffect(() =>
		this.actions$.pipe(
			ofType(AppActions.init),
			switchMap(() => this.authService.user$.pipe(
				tap(() => this.navigation.clearRouteHistory()),
				map(user => {
					if (user) {
						return UserActions.get({ id: user.uid });
					}

					return AppActions.initialized();
				})
			))
		)
	);
}