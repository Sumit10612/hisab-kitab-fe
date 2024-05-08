import { Component, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatDividerModule } from "@angular/material/divider";
import { MatIconModule } from "@angular/material/icon";
import { MatRadioChange, MatRadioModule } from "@angular/material/radio";
import { Router, RouterLink } from "@angular/router";

import { getUserImage } from "../models/user.model";
import { AuthService } from "../services/auth.service";
import { NotificationService } from "../services/notification.service";
import { UserService } from "../services/user.service";
import { getFirebaseErrorMessage } from "../utilities/firebase-errors";

import { PageNavHeaderComponent } from "./shared/page-nav-header.component";
import { LayoutComponent } from "./shared/layout.component";

@Component({
	selector: "app-profile",
	standalone: true,
	imports: [
		MatButtonModule,
		MatIconModule,
		MatRadioModule,
		PageNavHeaderComponent,
    LayoutComponent,
    RouterLink
	],
	template: `
    <app-layout>
      <div section="header">
        <app-page-nav-header backRoute="/home" title="Profile"></app-page-nav-header>
        <div class="profile-section">
          @if (userService.currentUser()) {
            <img
                width="80" 
                height="80"
                class="mat-elavation-z1"
                [src]="getUserImage(userService.currentUser()?.photoUrl).src"
                [alt]="getUserImage(userService.currentUser()?.photoUrl).alt"
            />

            <span>{{userService.currentUser()?.name}}</span>
            <span>{{userService.currentUser()?.email}}</span>

            <a role="button" mat-mini-fab color="secondary" routerLink="/edit-profile">
              <mat-icon>edit</mat-icon>
            </a>
          }
        </div>
      </div>
      <div section="detail">
        <div class="preferences-section">
          <span>Theme</span>
          <mat-radio-group
            name="themeSelector"
            color="warn"
            [value]="userService.currentUser()?.preferences?.theme ?? 'light'"
            (change)="onThemeChange($event)"
            >
            <mat-radio-button value="light">Light</mat-radio-button>
            <mat-radio-button value="dark">Dark</mat-radio-button>
          </mat-radio-group>
        </div>
          
        <div class="margin-top text-center">
          <button mat-raised-button color="primary" (click)="logout()">Logout</button>
        </div>
      </div>
    </app-layout>
  `,
	styles: [`
    .profile-section {
      display: flex;
      flex-direction: column;
      align-items: center;

      > img {
        margin-bottom: 8px;
      }

      > a {
        margin: 0 0 8px auto;
      }
    }

    .preferences-section {
      margin: 16px;
    }
  `]
})
export class ProfileComponent {
	private router = inject(Router);
	private readonly authService = inject(AuthService);
	private readonly notificationService = inject(NotificationService);
  
	protected readonly userService = inject(UserService);

	protected getUserImage = getUserImage;

	async logout() {
		await this.authService.logout();

		this.router.navigate(["/login"]);
	}

	async onThemeChange($event: MatRadioChange) {
		const user = this.userService.currentUser();
		if(user) {
			const { uid, ...data } = user;
			data.preferences = {
				theme: $event.value
			};

			try {
				this.notificationService.showLoading();
				await this.userService.updateUser({ uid, ...data });
			} catch (err) {
				this.notificationService.error(getFirebaseErrorMessage(err));
			} finally {
				this.notificationService.hideLoading();
			}
		}
	}
}
