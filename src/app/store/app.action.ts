import { createAction } from "@ngrx/store";

export namespace AppActions {
	const ACTION_PREFIX = "[App] -";

	export const init = createAction(`${ACTION_PREFIX} Init`);
	export const initialized = createAction(`${ACTION_PREFIX} Initialized`);
}