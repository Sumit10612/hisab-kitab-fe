import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';

import { AuthService } from './services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    MatToolbarModule,
    MatIconModule,
    MatProgressSpinner,
    RouterLink
  ],
  template: `
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
  `,
  styles: [`
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
}
