import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { UserService } from '../services/user.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatCardModule, 
    MatButtonModule, 
    MatIconModule,
    RouterLink
  ],
  template: `
    <div class="header-section">
      <a routerLink="/profile">
        @if (userService.currentUser()?.photoUrl) {
          <img
              width="55" 
              height="55"
              class="mat-elevation-z10"
              src="/assets/images/user-placeholder.png"
              alt="placeholder" />
        } @else { 
          <button mat-fab color="secondary">
            <mat-icon>person</mat-icon>
          </button>
        }
      </a>

      <button mat-fab color="secondary">
          <mat-icon>notifications</mat-icon>
      </button>
  </div>

  <div class="overview-widget mat-elevation-z20">
    <mat-card>
      <mat-card-header>
        <h2>Total Balance</h2>
        <h2><mat-icon>currency_rupee</mat-icon>123</h2>
      </mat-card-header>
      <mat-card-content>
        I Owe
      </mat-card-content>
    </mat-card>
  </div>

  <a class="addGroup" mat-fab>
      <mat-icon>add</mat-icon>
  </a>
  `,
  styles: [`
    .header-section {
      display: flex;
      justify-content: space-between;
      margin-bottom: 16px;

      > a > img {
        border-radius: 100%;
      }
    }

    .overview-widget {
      margin: 16px;
      border-radius: 32px;
      
      .mat-mdc-card {
        border-radius: 32px;
      }
    }

    mat-card-header {
      display: flex;
      gap: 16px;
    }

    .addGroup {
      position: fixed;
      right: 20px;
      bottom: 20px;
    }
  `]
})
export class HomeComponent {
  protected readonly userService = inject(UserService);

}
