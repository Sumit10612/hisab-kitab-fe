import { CommonModule } from "@angular/common";
import {
	Component,
	effect,
	HostBinding,
	inject,
	OnInit,
	Renderer2
} from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatSnackBar } from "@angular/material/snack-bar";
import { MatToolbarModule } from "@angular/material/toolbar";
import { RouterLink, RouterOutlet } from "@angular/router";
import { SwUpdate } from "@angular/service-worker";

import { ToolbarButtonType } from "./models/toolbar.model";
import { getUserImage } from "./models/user.model";
import { NavigationService } from "./services/navigation.service";
import { NotificationService } from "./services/notification.service";
import { ThemeService } from "./services/theme.service";
import { ToolbarConfigurationService } from "./services/toolbar-configuration.service";
import { UserService } from "./services/user.service";

@Component({
	selector: "app-root",
	standalone: true,
	imports: [
		CommonModule,
		MatButtonModule,
		MatIconModule,
		MatProgressSpinner,
		MatToolbarModule,
		RouterLink,
		RouterOutlet,
	],
	template: `
		<div class="container">
			<div class="content">
				<router-outlet></router-outlet>
			</div>

			@if (toolbar.config) {
				<mat-toolbar>
					@if (toolbar.config.back?.visible) {
						<button mat-icon-button (click)="navigation.navigateBack()">
							<mat-icon>arrow_back</mat-icon>
						</button>
					}

					@if (toolbar.config.profile?.visible) {
						<a routerLink="/profile">
							<img
								width="55" 
								height="55"
								[src]="getUserImage(userService.currentUser()?.photoUrl).src"
								[alt]="getUserImage(userService.currentUser()?.photoUrl).alt" />
						</a>
					}

					<div class="btn-group">
						@for (actionBtn of toolbar.config.actionBtns; track actionBtn) {
							<button mat-raised-button
								[color]="getColor(actionBtn.type)"
								[disabled]="actionBtn.disabled?.()"
								[hidden]="!(actionBtn.visible?.() ?? true)"
								[routerLink]="actionBtn.redirectTo"
								(click)="actionBtn.action?.()">
									@if (actionBtn.icon) {
										<mat-icon>{{actionBtn.icon}}</mat-icon>
									}
									{{actionBtn.label}}
							</button>
						}
					</div>
				</mat-toolbar>
			}
		</div>

		@if(notification.loading()) {
			<mat-progress-spinner mode="indeterminate" diameter="50"></mat-progress-spinner>
		}
	`,
	styles: [`
		.container {
			display: flex;
			flex-direction: column;
			max-width: 500px;
			height: 100%;
			margin: 0 auto;
		}

		.content {
			flex: 1;
		}

		mat-toolbar {
			flex: none;
			align-self: flex-end;
			padding: 8px;

			display: flex;
			justify-content: space-between;

			.btn-group {
				display: flex;
				gap: 8px;

				> a, > button {
					border-radius: 16px;
				}
			}
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

	protected readonly navigation = inject(NavigationService);
	protected readonly theme = inject(ThemeService);
	protected readonly notification = inject(NotificationService);
	protected readonly toolbar = inject(ToolbarConfigurationService);
	protected readonly userService = inject(UserService);

	protected getUserImage = getUserImage;

	constructor() {
		effect(() => {
			this.theme.$theme() === "dark" ?
				this.renderer.addClass(document.body, "dark-theme") :
				this.renderer.removeClass(document.body, "dark-theme");
		});
	}

	ngOnInit() {
		this.navigation.clearRouteHistory();

		// Checking service worker based update
		if (this.swUpdate.isEnabled) {
			this.swUpdate.checkForUpdate();
			this.swUpdate.versionUpdates.subscribe(update => {
				if (update.type === "VERSION_READY") {
					const sb = this.snackBar.open("New version of an app is available", "Install now", { duration: 50000 });
					sb.onAction().subscribe(() => {
						location.reload();
					});
				}
			});
		}
	}

	getColor(type: ToolbarButtonType) {
		switch (type) {
			case ToolbarButtonType.Primary:
				return "primary";
			case ToolbarButtonType.Warn:
				return "warn";
			default:
				return "";
		}
	}
}
