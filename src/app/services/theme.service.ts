import { effect, inject, Injectable, signal } from "@angular/core";

import { UserSelector } from "../store/user/user.selector";
import { Store } from "@ngrx/store";

@Injectable({
	providedIn: "root"
})
export class ThemeService {
	private readonly store = inject(Store);

    constructor() {
        effect(() => {
            const theme = this.store.selectSignal(UserSelector.select)().preferences?.theme;
            if(theme && theme !== this.$theme()) {
                localStorage.setItem("theme", theme);
				this.$theme.set(theme);
            }
        });
    }

	$theme = signal(localStorage.getItem("theme"));
}
