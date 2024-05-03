import { Component, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { UserService } from '../services/user.service';
import { MatRadioChange, MatRadioModule } from '@angular/material/radio';
import { NotificationService } from '../services/notification.service';
import { getFirebaseErrorMessage } from '../utilities/firebase-errors';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    MatButtonModule,
    MatDividerModule,
    RouterLink,
    MatRadioModule
  ],
  template: `
    <div class="profile-section">
      <img
          width="80" 
          height="80"
          class="mat-elavation-z1"
          src="/assets/image-placeholder.png"
          alt="placeholder"
      />

      <div class="profile-section-info">
        <span>{{userService.currentUser()?.name}}</span>
        <span>{{userService.currentUser()?.email}}</span>
        
        <a routerLink="/edit-profile">edit</a>
      </div>
    </div>

    <mat-divider></mat-divider>

    <div class="preferences-section">
      <span>Theme</span>
      <mat-radio-group
        name="themeSelector"
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
  `,
  styles: [
    `
      .profile-section {
        display: block;

        > img {
          border-radius: 100%;
          object-fit: cover;
          object-position: center;
        }

        &-info {
          float: right;
          display: flex;
          flex-direction: column;
          margin-top: 16px;

          > a {
            justify-content: center;
          }
        }
      }

      .preferences-section {
        margin: 16px 0;
      }
    `
  ]
})
export class ProfileComponent {
  private router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  
  protected readonly userService = inject(UserService);

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
