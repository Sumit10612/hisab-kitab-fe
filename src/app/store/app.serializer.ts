import { Params, RouterStateSnapshot } from "@angular/router";
import { RouterStateSerializer } from "@ngrx/router-store";

export interface AppRouterState {
    url: string;
    params: Params;
    queryParams: Params;
}

export class AppRouterStateSerializer
    implements RouterStateSerializer<AppRouterState>
{
    serialize(routerState: RouterStateSnapshot): AppRouterState {
        let route = routerState.root;
        while (route.firstChild) {
            route = route.firstChild;
        }

        const {
            url,
            root: { queryParams },
        } = routerState;
        const { params } = route;

        return { url, params, queryParams };
    }
}
