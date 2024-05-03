import { Component, inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIcon } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { ThemeService } from '../services/theme.service';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    MatButtonModule,
    MatSlideToggleModule,
    MatIcon,
    MatDividerModule,
    RouterLink
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
      <mat-slide-toggle labelPosition="before" (click)="toggelTheme()">Dark mode</mat-slide-toggle>
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
        margin: 16px;
      }
    `
  ]
})
export class ProfileComponent {
  private router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly themeService = inject(ThemeService);
  
  protected readonly userService = inject(UserService);

  async logout() {
    await this.authService.logout();

    this.router.navigate(["/login"]);
  }
  
  toggelTheme() {
    this.themeService.updateTheme();
  }
}
