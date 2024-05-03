import { Component, OnInit, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';

import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { NotificationService } from './services/notification.service';
import { CommonModule } from '@angular/common';
import { UserService } from './services/user.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SwUpdate } from '@angular/service-worker';

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
    <div class="content" [ngClass]="userService.currentUser()?.preferences?.theme ?? 'light'">
      <mat-toolbar color="primary">Hisab Kitab

      @if(userService.currentUser()) {
        <a routerLink="/profile">
        <img
            width="30" 
            height="30"
            src="/assets/images/user-placeholder.png"
            alt="placeholder"
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
          })
        }
      });
    }

    // Prompting for installation
    if(window.matchMedia("display-mode: browser").matches) {
      if ("standalone" in navigator) {
        this.snackBar.open("You can install this app, use Share > Add to home screeen", "", { duration: 5000 });        
      } else {
        window.addEventListener("beforeinstallprompt", event => {
          event.preventDefault();
          const sb = this.snackBar.open("You can install this app", "Install", { duration: 5000 });
          sb.onAction().subscribe(() => {
            (event as any).prompt();
          });
        });
      }
    }
  }
}
