import { Component, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIcon } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDividerModule } from '@angular/material/divider';
import { ThemeService } from '../services/theme.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatSlideToggleModule,
    MatIcon,
    MatDividerModule
  ],
  template: `
    <div class="text-center">
      <div class="profile-image">
        <img
          width="120" 
          height="120"
          class="margin-top mat-elavation-z1"
          src="/assets/image-placeholder.png"
        />
        <button mat-mini-fab>
          <mat-icon>edit</mat-icon>
        </button>
      </div>

      <h1>{{authService.currentUser()?.displayName}}</h1>

      <mat-divider></mat-divider>

      <div class="row">
        <mat-slide-toggle labelPosition="before" (click)="toggelTheme()">Dark mode:</mat-slide-toggle>
        @if (themeService.theme() === "light") {
          <mat-icon>brightness_5</mat-icon>
        } @else {
          <mat-icon>bedtime</mat-icon>
        }
      </div>
      
      <div class="margin-top">
        <button mat-raised-button color="primary" (click)="logout()">Logout</button>
      </div>
    </div>
  `,
  styles: [
    `
      .profile-image {
        position: relative;
        width: 120px;
        margin: auto;

        > img {
          border-radius: 100%;
          object-fit: cover;
          object-position: center;
        }

        > button {
          position: absolute;
          bottom: 10px;
          right: 0;
        }
      }

      .row {
        display: flex;
        gap: 8px;
        margin-top: 16px;
      }
    `
  ]
})
export class ProfileComponent {
  private router = inject(Router);

  protected readonly authService = inject(AuthService);
  protected readonly themeService = inject(ThemeService);

  async logout() {
    await this.authService.logout();

    this.router.navigate(["/login"]);
  }
  
  toggelTheme() {
    this.themeService.updateTheme();
  }
}
