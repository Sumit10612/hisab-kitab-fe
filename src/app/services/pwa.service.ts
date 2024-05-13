import { Platform } from "@angular/cdk/platform";
import { inject, Injectable } from "@angular/core";
import { MatBottomSheet } from "@angular/material/bottom-sheet";
import { take, timer } from "rxjs";

import { PwaPromptComponent } from "../components/pwa-prompt.component";

@Injectable({
	providedIn: "root"
})
export class PwaService {
	private platform = inject(Platform);
	private bottomSheet = inject(MatBottomSheet);

	initPwaPrompt() {
		if(this.platform.ANDROID) {
			window.addEventListener("beforeinstallprompt", event => {
				event.preventDefault();
				this.openPromptComponent("android", event);
			});
		} else if(this.platform.IOS) {
			const isInStandaloneMode = ("standalone" in window.navigator) && (window.navigator["standalone"]);
			if (!isInStandaloneMode) {
				this.openPromptComponent("ios");
			}
		}
	}

	private openPromptComponent(platform: "android" | "ios", event?: any) {
		timer(2000)
			.pipe(take(1))
			.subscribe(() => this.bottomSheet.open(
				PwaPromptComponent, 
				{  
					data: { platform, event }
				}
			));
	}
}
