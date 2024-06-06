import { Injectable, signal } from "@angular/core";

import { UserService } from "./user.service";

@Injectable({
	providedIn: "root"
})
export class ThemeService {
	constructor(userServive: UserService) {
		userServive.get$.subscribe(user => {
			const themeFromUser = user.preferences?.theme ?? "";
			if (themeFromUser !== this.$theme()) {
				localStorage.setItem("theme", themeFromUser);
				this.$theme.set(themeFromUser);
			}
		});
	}

	$theme = signal(localStorage.getItem("theme"));
}
