import { Injectable, inject } from "@angular/core";
import { Actions, createEffect, ofType } from "@ngrx/effects";
import { AppActions } from "./app.action";
import { map, switchMap, tap } from "rxjs";
import { AuthService } from "../services/auth.service";
import { UserActions } from "./user/user.action";
import { NavigationService } from "../services/navigation.service";
import { Store } from "@ngrx/store";
import { GroupAction } from "./group/group.action";

@Injectable()
export class AppEffects {
	private readonly actions$ = inject(Actions);
	private readonly authService = inject(AuthService);
	private readonly navigation = inject(NavigationService);
	private readonly store = inject(Store);

	initApp$ = createEffect(() =>
		this.actions$.pipe(
			ofType(AppActions.init),
			switchMap(() => this.authService.user$.pipe(
				tap(() => this.navigation.clearRouteHistory()),
				map(user => {
					if (user) {
						this.store.dispatch(UserActions.get({ id: user.uid }));
						this.store.dispatch(GroupAction.getAll());
					}

					return AppActions.initialized();
				})
			))
		)
	);
}