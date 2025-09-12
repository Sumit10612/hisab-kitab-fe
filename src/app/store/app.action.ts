import { createAction, props } from "@ngrx/store";

export namespace AppActions {
    const ACTION_PREFIX = "[App] -";

    export const initialized = createAction(
        `${ACTION_PREFIX} Initialized`,
        props<{ loggedInUserId: string }>(),
    );

    export const handleError = createAction(
        `${ACTION_PREFIX} Error`,
        props<{ error: unknown }>(),
    );
}
