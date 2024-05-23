import { Injectable, signal } from "@angular/core";

import { UserService } from "./user.service";

@Injectable({
	providedIn: "root"
})
export class ThemeService {
	constructor(private userServive: UserService) {
		userServive.user$.subscribe(user => {
			const themeFromUser = user.preferences?.theme ?? "";
			if (themeFromUser !== this.$theme()) {
				localStorage.setItem("theme", themeFromUser);
				this.$theme.set(themeFromUser);
			}
		});
	}

	$theme = signal(localStorage.getItem("theme"));
}
