import { CommonModule } from "@angular/common";
import {
	Component,
	effect,
	HostBinding,
	inject,
	OnInit,
	Renderer2
} from "@angular/core";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatSnackBar } from "@angular/material/snack-bar";
import { RouterOutlet } from "@angular/router";
import { SwUpdate } from "@angular/service-worker";

import { NotificationService } from "./services/notification.service";
import { UserService } from "./services/user.service";
import { NavigationService } from "./services/navigation.service";

@Component({
	selector: "app-root",
	standalone: true,
	imports: [CommonModule, RouterOutlet, MatProgressSpinner],
	template: `
      <div class="container">
        <router-outlet></router-outlet>
      </div>

      @if(notificationService.loading()) {
        <mat-progress-spinner mode="indeterminate" diameter="50"></mat-progress-spinner>
      }
  `,
	styles: [`
    .container {
		max-width: 500px;
		margin: auto;
		min-height: 100vh;
	}

    mat-progress-spinner {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
    }
  `]
})
export class AppComponent implements OnInit {
	@HostBinding("class") class: string = "";

	private readonly snackBar = inject(MatSnackBar);
	private readonly swUpdate = inject(SwUpdate);
	private readonly renderer = inject(Renderer2);
	private readonly navigation = inject(NavigationService);

	protected readonly userService = inject(UserService);
	protected readonly notificationService = inject(NotificationService);

	constructor() {
		effect(() => {
			this.userService.currentUser()?.preferences?.theme === "dark" ?
				this.renderer.addClass(document.body, "dark-theme") :
				this.renderer.removeClass(document.body, "dark-theme");
		});
	}

	ngOnInit() {
		this.navigation.clearRouteHistory();
		
		// Checking service worker based update
		if(this.swUpdate.isEnabled) {
			this.swUpdate.checkForUpdate();
			this.swUpdate.versionUpdates.subscribe(update => {
				if(update.type === "VERSION_READY") {
					const sb = this.snackBar.open("New version of an app is available", "Install now", { duration: 50000 });
					sb.onAction().subscribe(() => {
						location.reload();
					});
				}
			});
		}
	}
}
