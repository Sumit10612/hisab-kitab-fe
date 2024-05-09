import { CommonModule } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatSnackBar } from "@angular/material/snack-bar";
import { RouterOutlet } from "@angular/router";
import { SwUpdate } from "@angular/service-worker";

import { NotificationService } from "./services/notification.service";
import { UserService } from "./services/user.service";

@Component({
	selector: "app-root",
	standalone: true,
	imports: [CommonModule, RouterOutlet, MatProgressSpinner],
	template: `
    <div [ngClass]="userService.currentUser()?.preferences?.theme ?? 'light'">
      <div class="container">
        <router-outlet></router-outlet>
      </div>

      @if(notificationService.loading()) {
        <mat-progress-spinner mode="indeterminate" diameter="50"></mat-progress-spinner>
      }
    </div>
  `,
	styles: [`
    .container {
		min-height: 100vh;
		max-width: 500px;
		margin: auto;
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
	private readonly snackBar = inject(MatSnackBar);
	private readonly swUpdate = inject(SwUpdate);

	protected readonly userService = inject(UserService);
	protected readonly notificationService = inject(NotificationService);

	ngOnInit() {
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
