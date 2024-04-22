import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';

import { AuthService } from './services/auth.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    MatToolbarModule, 
    MatMenuModule, 
    MatButtonModule, 
    MatIconModule,
    MatProgressSpinner
  ],
  template: `
    <mat-toolbar color="primary">Hisab Kitab

    @if(currentUser()) {
      <button mat-button [mat-menu-trigger-for]="userMenu">
        {{ currentUser()?.displayName }}
        <mat-icon>expand_more</mat-icon>
      </button>
    }

    <mat-menu #userMenu="matMenu">
      <button mat-menu-item (click)="logout()">
        <mat-icon>logout</mat-icon>
        Logout
      </button>
    </mat-menu>
    </mat-toolbar>

    <div class="container">
      <router-outlet></router-outlet>
    </div>

    @if(loading()) {
      <mat-progress-spinner mode="indeterminate" diameter="50"></mat-progress-spinner>
    }
  `,
  styles: [`
    .container {
      padding: 24px;
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
  `]
})
export class AppComponent { 

  authService = inject(AuthService);
  router = inject(Router);
  notificationService = inject(NotificationService);

  currentUser = this.authService.currentUser;
  loading = this.notificationService.loading;

  async logout() {
    await this.authService.logout();

    this.router.navigate(["/login"]);
  }
}
