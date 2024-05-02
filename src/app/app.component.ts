import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';

import { AuthService } from './services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { NotificationService } from './services/notification.service';
import { ThemeService } from './services/theme.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet, 
    MatToolbarModule,
    MatIconModule,
    MatProgressSpinner,
    RouterLink
  ],
  template: `
    <div class="content" [ngClass]="themeService.theme()">
      <mat-toolbar color="primary">Hisab Kitab

      @if(authService.currentUser()) {
        <a routerLink="/profile">
        <img
            width="30" 
            height="30"
            src="/assets/image-placeholder.png"
          />
        </a>
      }
      </mat-toolbar>

      <div class="card">
        <router-outlet></router-outlet>
      </div>

      @if(notificationService.loading()) {
        <mat-progress-spinner mode="indeterminate" diameter="50"></mat-progress-spinner>
      }
    </div>
  `,
  styles: [`
    .content {
      min-height: 100vh;
    }

    mat-toolbar {
      justify-content: space-between;
    }

    mat-progress-spinner {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    a {
        cursor: pointer;
      }
    
      img {
        border-radius: 100%;
        object-fit: cover;
        object-position: center;
      }
  `]
})
export class AppComponent {
  protected readonly authService = inject(AuthService);
  protected readonly notificationService = inject(NotificationService);
  protected readonly themeService = inject(ThemeService);
}
