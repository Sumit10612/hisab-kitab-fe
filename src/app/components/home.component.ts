import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { UserService } from '../services/user.service';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatCardModule, 
    MatButtonModule, 
    MatIconModule,
    MatDividerModule,
    RouterLink
  ],
  template: `
    <div class="header-section">
      <a routerLink="/profile">
        <img
          width="55" 
          height="55"
          class="mat-elevation-z10"
          [src]="(userService.currentUser()?.photoUrl) ?? '/assets/avatars/avatar_0.png'"
          alt="placeholder" 
        />
      </a>

      <button mat-fab color="secondary">
          <mat-icon>notifications</mat-icon>
      </button>
  </div>

  <div class="overview-widget mat-elevation-z20">
    <mat-card>
      <mat-card-content>
        <div class="overview-widget-header">
          <h3>Total Balance</h3>
          <h2>
            <mat-icon>currency_rupee</mat-icon>
            <span>10012</span>
          </h2>
        </div>
        <mat-divider></mat-divider>
        <div class="overview-widget-content">
          <div>
            <span style="color: red; font-weight: 700;">5512</span>
            <span>you owe</span>
          </div>
          <div>
            <span style="color: green; font-weight: 700;">5512</span>
            <span>you are owed</span>
          </div>
        </div>
      </mat-card-content>
    </mat-card>
  </div>

  <div class="groups_widget">
    <span>Groups</span>
    <mat-card>
      <mat-card-content>
        <a role="button" mat-mini-fab color="secondary">
          <mat-icon>group_add</mat-icon>
        </a>
      </mat-card-content>
    </mat-card>
  </div>
  `,
  styles: [`
    .header-section {
      display: flex;
      justify-content: space-between;

      > a > img {
        border-radius: 100%;
      }
    }

    .overview-widget {
      margin: 16px 0 24px 0;
      border-radius: 32px;
      
      .mat-mdc-card {
        border-radius: 32px;
        padding: 0 16px;
      }

      &-header {
        display: flex;
        justify-content: space-between;
      }

      &-content {
        margin-top: 16px;
        display: flex;
        justify-content: space-between;

        > div {
          display: flex;
          flex-direction: column;
          align-items: center;
        }
      }
    }

    .groups_widget {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .mat-icon {
      vertical-align: middle;
    }
  `]
})
export class HomeComponent {
  protected readonly userService = inject(UserService);

}
